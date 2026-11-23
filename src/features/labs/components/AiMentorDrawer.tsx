import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Button,
  ErrorState,
  Icon,
  IconButton,
  Markdown,
  Textarea,
  usePresence,
} from '@/shared/components';
import { useRetryAfter } from '@/shared/hooks';
import { getErrorMessage } from '@/shared/services/apiError';
import { aiMentorService, AiMentorError } from '../services/aiMentorService';
import { MentorOrb, type MentorOrbState } from './MentorOrb';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AiMentorDrawerProps {
  /** Defaults to true: callers that mount the drawer only while it is open may omit it. */
  open?: boolean;
  onClose: () => void;
  /** Lesson context (item page). Omit both ids for general mode (personal dashboard). */
  lessonId?: number;
  /** Lab context (lab workspace). */
  labId?: number;
  /** Notifies the host FAB orb whenever the AI Mentor transitions between bot states. */
  onBotStateChange?: (state: MentorOrbState) => void;
}

const MAX_MESSAGE_LENGTH = 2000;
const GLASS_EXIT_MS = 220;
const SUCCESS_HOLD_MS = 1200;

/**
 * Floating frosted-glass AI Mentor panel originating from and closing back into
 * the bottom-right MentorOrb trigger. Drives the full 8-state orb lifecycle
 * (rest -> listening -> thinking -> working -> success/error -> rest) and
 * renders sanitized Markdown replies.
 */
export function AiMentorDrawer({
  open = true,
  onClose,
  lessonId,
  labId,
  onBotStateChange,
}: AiMentorDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const [recentSuccess, setRecentSuccess] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const titleId = useId();
  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const successTimerRef = useRef<number | null>(null);
  const { mounted, closing } = usePresence(open, GLASS_EXIT_MS);

  const { secondsLeft, blocked } = useRetryAfter(error);
  const rateLimited = error instanceof AiMentorError && error.reason === 'rate_limited';

  const orbState: MentorOrbState = streaming
    ? pendingText.length > 0
      ? 'working'
      : 'thinking'
    : error
      ? 'error'
      : recentSuccess
        ? 'success'
        : draft.trim().length > 0
          ? 'listening'
          : 'rest';

  useEffect(() => {
    onBotStateChange?.(orbState);
  }, [orbState, onBotStateChange]);

  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingText, error]);

  useEffect(() => {
    if (!open) {
      abortRef.current?.abort();
      return undefined;
    }
    const focusTimer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (successTimerRef.current !== null) {
        window.clearTimeout(successTimerRef.current);
      }
    };
  }, []);

  const clearSuccessTimer = () => {
    if (successTimerRef.current !== null) {
      window.clearTimeout(successTimerRef.current);
      successTimerRef.current = null;
    }
  };

  const runStream = async (content: string, appendUser: boolean) => {
    abortRef.current?.abort();
    clearSuccessTimer();
    setRecentSuccess(false);

    const controller = new AbortController();
    abortRef.current = controller;

    setError(null);
    setLastQuestion(content);
    setStreaming(true);
    setPendingText('');
    if (appendUser) {
      setMessages((prev) => [...prev, { role: 'user', content }]);
    }

    try {
      const reply = await aiMentorService.streamMessage(
        { message: content, lessonId, labId },
        {
          signal: controller.signal,
          onDelta: (text) => setPendingText((prev) => prev + text),
        },
      );
      if (controller.signal.aborted) return;
      if (reply.trim().length > 0) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
      setRecentSuccess(true);
      successTimerRef.current = window.setTimeout(() => {
        setRecentSuccess(false);
      }, SUCCESS_HOLD_MS);
    } catch (failure) {
      if (controller.signal.aborted) return;
      setError(failure);
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
        setPendingText('');
        setStreaming(false);
      }
    }
  };

  const canSend = !streaming && !blocked && draft.trim().length > 0;

  const submit = () => {
    const content = draft.trim();
    if (!canSend || content.length === 0) return;
    setDraft('');
    void runStream(content, true);
  };

  const stop = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearSuccessTimer();
    setRecentSuccess(false);
    setPendingText('');
    setStreaming(false);
  };

  const retry = () => {
    if (!lastQuestion || streaming || blocked) return;
    void runStream(lastQuestion, false);
  };

  const clear = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    clearSuccessTimer();
    setRecentSuccess(false);
    setMessages([]);
    setPendingText('');
    setError(null);
    setLastQuestion(null);
    setStreaming(false);
  };

  if (!mounted || typeof document === 'undefined') {
    return null;
  }

  const errorMessage = error
    ? getErrorMessage(error, 'AI Mentor is temporarily unavailable.')
    : null;
  const canRetry =
    lastQuestion !== null &&
    error !== null &&
    !(error instanceof AiMentorError && error.reason === 'forbidden');

  return createPortal(
    <div className="overlay-root">
      <section
        className="ai-mentor-glass"
        data-testid="ai-mentor-modal"
        data-state={closing ? 'closed' : 'open'}
        role="dialog"
        aria-labelledby={titleId}
      >
        <header className="ai-mentor-glass__header">
          <div className="ai-mentor-glass__identity">
            <MentorOrb state={orbState} size="sm" />
            <h2 id={titleId} className="ai-mentor-glass__title">
              AI Mentor
            </h2>
          </div>
          <div className="ai-mentor-glass__actions">
            {messages.length > 0 && !streaming ? (
              <Button
                variant="ghost"
                size="sm"
                className="ai-mentor-glass__action-btn"
                onClick={clear}
              >
                Clear
              </Button>
            ) : null}
            <IconButton
              icon="x"
              label="Close AI Mentor"
              size="sm"
              showTooltip={false}
              className="ai-mentor-glass__action-btn"
              onClick={onClose}
            />
          </div>
        </header>

        <div ref={historyRef} className="ai-mentor-glass__history" aria-live="polite">
          {messages.length === 0 && !streaming && !error ? (
            <div className="my-auto flex flex-col items-center justify-center gap-2.5 px-6 py-10 text-center">
              <Icon name="mentor" size={28} className="text-pearl-200/80" />
              <p className="m-0 text-sm font-medium text-pearl-100/85">Ask your first question</p>
            </div>
          ) : null}

          {messages.map((message, index) =>
            message.role === 'user' ? (
              <div
                key={`user-${index}`}
                className="ai-mentor-glass__msg ai-mentor-glass__msg--user motion-fade-in"
              >
                {message.content}
              </div>
            ) : (
              <div
                key={`assistant-${index}`}
                className="ai-mentor-glass__msg ai-mentor-glass__msg--assistant motion-fade-in"
              >
                <Markdown variant="inverse">{message.content}</Markdown>
              </div>
            ),
          )}

          {streaming ? (
            <div
              className="ai-mentor-glass__msg ai-mentor-glass__msg--assistant"
              aria-label="AI Mentor is replying"
            >
              {pendingText.length > 0 ? (
                <Markdown variant="inverse">{pendingText}</Markdown>
              ) : (
                <p className="m-0 flex items-center gap-2 text-pearl-200">
                  <Icon name="hourglass" size={16} />
                  Thinking…
                </p>
              )}
            </div>
          ) : null}

          {error ? (
            <div className="motion-fade-in flex flex-col gap-1">
              <ErrorState
                compact
                error={error}
                message={errorMessage ?? undefined}
                onRetry={canRetry && !blocked ? retry : undefined}
                retrying={streaming}
                className="ai-mentor-glass__error"
              />
              {rateLimited && secondsLeft > 0 ? (
                <p className="text-xs text-pearl-200/80" role="status">
                  Ready again in {secondsLeft}s.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <footer className="ai-mentor-glass__footer">
          <div className="flex items-end gap-2">
            <Textarea
              ref={inputRef}
              aria-label="Message to the AI Mentor"
              className="ai-mentor-glass__input min-h-0 flex-1 resize-none"
              value={draft}
              maxLength={MAX_MESSAGE_LENGTH}
              rows={2}
              placeholder="Ask the AI Mentor…"
              disabled={blocked}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  submit();
                }
              }}
            />
            {streaming ? (
              <IconButton
                icon="stop"
                label="Stop reply"
                className="ai-mentor-glass__action-btn"
                onClick={stop}
              />
            ) : (
              <Button
                size="sm"
                iconName="send"
                className="ai-mentor-glass__send"
                onClick={submit}
                disabled={!canSend}
                aria-describedby={blocked ? 'ai-mentor-retry-status' : undefined}
              >
                Send
              </Button>
            )}
          </div>
          {blocked ? (
            <p id="ai-mentor-retry-status" className="m-0 text-xs text-pearl-200/80" role="status">
              Too many questions. You can ask again in {secondsLeft}s.
            </p>
          ) : null}
        </footer>
      </section>
    </div>,
    document.body,
  );
}

/** @deprecated legacy name of `AiMentorDrawer` (LabWorkspace, removed in wave 4). */
export const AiMentorModal = AiMentorDrawer;

export default AiMentorDrawer;

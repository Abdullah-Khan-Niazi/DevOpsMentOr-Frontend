import { useEffect, useRef, useState } from 'react';
import {
  Button,
  Drawer,
  EmptyState,
  ErrorState,
  IconButton,
  Icon,
  Markdown,
  Textarea,
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
  /** @deprecated the orb state is shown inside the drawer; kept for the legacy LabWorkspace. */
  onBotStateChange?: (state: MentorOrbState) => void;
}

const MAX_MESSAGE_LENGTH = 2000;

/**
 * AI Mentor chat on the shared `Drawer` (portal, focus trap, Esc, overlay stack).
 * States: empty (prompt only), streaming (partial reply with a stop button), error
 * with retry, and rate-limited with a countdown. Replies are rendered through the
 * shared sanitized `Markdown`. The bearer token and the 401 refresh live in
 * `aiMentorService`; no URL comes from the user.
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
  const [error, setError] = useState<unknown>(null);
  const [lastQuestion, setLastQuestion] = useState<string | null>(null);

  const historyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { secondsLeft, blocked } = useRetryAfter(error);
  const rateLimited = error instanceof AiMentorError && error.reason === 'rate_limited';

  const orbState: MentorOrbState = streaming
    ? pendingText.length > 0
      ? 'working'
      : 'thinking'
    : error
      ? 'error'
      : draft.trim().length > 0
        ? 'listening'
        : 'rest';

  useEffect(() => {
    onBotStateChange?.(orbState);
  }, [orbState, onBotStateChange]);

  useEffect(() => {
    historyRef.current?.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingText, error]);

  // Closing (or leaving the page) stops an in-flight reply so nothing updates a closed drawer.
  useEffect(() => {
    if (!open) abortRef.current?.abort();
    return () => abortRef.current?.abort();
  }, [open]);

  const runStream = async (content: string, appendUser: boolean) => {
    abortRef.current?.abort();
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
    setMessages([]);
    setPendingText('');
    setError(null);
    setLastQuestion(null);
    setStreaming(false);
  };

  const errorMessage = error
    ? getErrorMessage(error, 'AI Mentor is temporarily unavailable.')
    : null;
  const canRetry =
    lastQuestion !== null &&
    error !== null &&
    !(error instanceof AiMentorError && error.reason === 'forbidden');

  const footer = (
    <div className="flex flex-col gap-2">
      <div className="flex items-end gap-2">
        <Textarea
          ref={inputRef}
          aria-label="Message to the AI Mentor"
          className="min-h-0 flex-1 resize-none"
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
          <IconButton icon="stop" label="Stop reply" onClick={stop} />
        ) : (
          <Button
            size="sm"
            iconName="send"
            onClick={submit}
            disabled={!canSend}
            aria-describedby={blocked ? 'ai-mentor-retry-status' : undefined}
          >
            Send
          </Button>
        )}
      </div>
      {blocked ? (
        <p id="ai-mentor-retry-status" className="text-xs text-muted-foreground" role="status">
          Too many questions. You can ask again in {secondsLeft}s.
        </p>
      ) : null}
    </div>
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="AI Mentor"
      size="lg"
      dirty={draft.trim().length > 0}
      initialFocusRef={inputRef}
      footer={footer}
    >
      <div className="flex min-h-full flex-col gap-4">
        <div className="flex items-center gap-3">
          <MentorOrb state={orbState} size="sm" />
          {messages.length > 0 && !streaming ? (
            <Button variant="ghost" size="sm" onClick={clear} className="ml-auto">
              Clear
            </Button>
          ) : null}
        </div>

        <div ref={historyRef} className="flex min-h-0 flex-1 flex-col gap-3" aria-live="polite">
          {messages.length === 0 && !streaming && !error ? (
            <EmptyState icon="mentor" title="Ask your first question" />
          ) : null}

          {messages.map((message, index) =>
            message.role === 'user' ? (
              <div
                key={`user-${index}`}
                className="motion-fade-in ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-2xl bg-surface-hover px-3 py-2 text-sm text-card-foreground"
              >
                {message.content}
              </div>
            ) : (
              <div
                key={`assistant-${index}`}
                className="motion-fade-in min-w-0 max-w-full text-sm text-card-foreground"
              >
                <Markdown variant="compact">{message.content}</Markdown>
              </div>
            ),
          )}

          {streaming ? (
            <div
              className="min-w-0 max-w-full text-sm text-card-foreground"
              aria-label="AI Mentor is replying"
            >
              {pendingText.length > 0 ? <Markdown variant="compact">{pendingText}</Markdown> : null}
              {pendingText.length === 0 ? (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Icon name="hourglass" size={16} />
                  Thinking…
                </p>
              ) : null}
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
              />
              {rateLimited && secondsLeft > 0 ? (
                <p className="text-xs text-muted-foreground" role="status">
                  Ready again in {secondsLeft}s.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </Drawer>
  );
}

/** @deprecated legacy name of `AiMentorDrawer` (LabWorkspace, removed in wave 4). */
export const AiMentorModal = AiMentorDrawer;

export default AiMentorDrawer;

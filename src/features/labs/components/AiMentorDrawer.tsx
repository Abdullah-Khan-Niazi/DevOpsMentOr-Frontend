import { useEffect, useRef, useState } from 'react';
import { Button, toast } from '@/shared/components';
import { aiMentorService } from '../services/aiMentorService';
import { MentorOrb, type MentorOrbState } from './MentorOrb';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiMentorModalProps {
  lessonId: number;
  labId?: number;
  onClose?: () => void;
  onBotStateChange?: (state: MentorOrbState) => void;
}

/**
 * Floating AI Mentor chat modal originating from the bottom-right isometric trigger.
 * Streams SSE deltas and drives the dotted 3D spherical orb across all bot states.
 */
export function AiMentorModal({ lessonId, labId, onClose, onBotStateChange }: AiMentorModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const [botState, setBotState] = useState<MentorOrbState>('rest');
  const scrollRef = useRef<HTMLDivElement>(null);
  const resetTimerRef = useRef<number | null>(null);

  const updateBotState = (next: MentorOrbState): void => {
    setBotState(next);
    onBotStateChange?.(next);
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingText]);

  useEffect(() => {
    if (!onClose) return;
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current !== null) {
        window.clearTimeout(resetTimerRef.current);
      }
    };
  }, []);

  const scheduleRest = (delayMs: number): void => {
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    resetTimerRef.current = window.setTimeout(() => {
      updateBotState('rest');
    }, delayMs);
  };

  const send = async (): Promise<void> => {
    const content = input.trim();
    if (content.length === 0 || isStreaming) {
      return;
    }
    if (resetTimerRef.current !== null) {
      window.clearTimeout(resetTimerRef.current);
    }
    setInput('');
    setIsStreaming(true);
    updateBotState('thinking');
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setPendingText('');
    let hadError = false;
    try {
      const events = await aiMentorService.streamMessage(content, lessonId, labId);
      let reply = '';
      for (const event of events) {
        if (event.delta !== undefined) {
          if (reply.length === 0) {
            updateBotState('working');
          }
          reply += event.delta;
          setPendingText(reply);
        }
        if (event.done) {
          break;
        }
        if (event.error) {
          hadError = true;
          toast.error(event.error);
        }
      }
      if (reply.length > 0) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
      if (hadError) {
        updateBotState('error');
        scheduleRest(1400);
      } else {
        updateBotState('success');
        scheduleRest(1200);
      }
    } catch (error) {
      toast.error((error as Error).message ?? 'AI Mentor is temporarily unavailable.');
      updateBotState('error');
      scheduleRest(1400);
    } finally {
      setPendingText('');
      setIsStreaming(false);
    }
  };

  const clear = (): void => {
    if (!window.confirm('Clear conversation history?')) {
      return;
    }
    setMessages([]);
    setPendingText('');
    updateBotState('rest');
  };

  return (
    <section
      className="ai-mentor-modal"
      data-testid="ai-mentor-modal"
      role="dialog"
      aria-label="AI Mentor"
    >
      <header className="ai-mentor-modal__header">
        <div className="ai-mentor-modal__identity">
          <MentorOrb state={botState} size="sm" />
          <h2 className="ai-mentor-modal__title">AI Mentor</h2>
        </div>
        <div className="ai-mentor-modal__header-actions">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close AI Mentor">
              ✕
            </Button>
          )}
        </div>
      </header>

      <div className="ai-mentor-modal__history" ref={scrollRef}>
        {messages.length === 0 && !pendingText && (
          <p className="ai-mentor-modal__empty">Ask me anything about this lesson or lab.</p>
        )}
        {messages.map((message, index) => (
          <div
            key={`${message.role}-${index}`}
            className={`ai-mentor-message ai-mentor-message--${message.role}`}
          >
            {message.content}
          </div>
        ))}
        {isStreaming && (
          <div className="ai-mentor-message ai-mentor-message--assistant">
            {pendingText}
            <span className="ai-mentor-modal__typing" aria-label="AI Mentor is typing" />
          </div>
        )}
      </div>

      <footer className="ai-mentor-modal__input-row">
        <textarea
          className="ai-mentor-modal__input"
          value={input}
          maxLength={2000}
          rows={2}
          placeholder="Ask the AI Mentor…"
          onChange={(event) => {
            const nextVal = event.target.value;
            setInput(nextVal);
            if (!isStreaming) {
              updateBotState(nextVal.trim().length > 0 ? 'listening' : 'rest');
            }
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <Button onClick={() => void send()} isLoading={isStreaming} size="sm">
          Send
        </Button>
      </footer>
    </section>
  );
}

export const AiMentorDrawer = AiMentorModal;
export default AiMentorModal;

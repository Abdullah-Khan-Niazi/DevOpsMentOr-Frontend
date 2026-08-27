import { useEffect, useRef, useState } from 'react';
import { Button, toast } from '@/shared/components';
import { aiMentorService } from '../services/aiMentorService';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiMentorDrawerProps {
  lessonId: number;
  labId?: number;
  onClose?: () => void;
}

/**
 * SCR-F6-05: AI Mentor drawer. Streams deltas from the SSE endpoint and
 * appends them word by word; supports clearing the conversation.
 */
export function AiMentorDrawer({ lessonId, labId, onClose }: AiMentorDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingText, setPendingText] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pendingText]);

  const send = async (): Promise<void> => {
    const content = input.trim();
    if (content.length === 0 || isStreaming) {
      return;
    }
    setInput('');
    setIsStreaming(true);
    setMessages((prev) => [...prev, { role: 'user', content }]);
    setPendingText('');
    try {
      const events = await aiMentorService.streamMessage(content, lessonId, labId);
      let reply = '';
      for (const event of events) {
        if (event.delta !== undefined) {
          reply += event.delta;
          setPendingText(reply);
        }
        if (event.done) {
          break;
        }
        if (event.error) {
          toast.error(event.error);
        }
      }
      if (reply.length > 0) {
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      }
    } catch (error) {
      toast.error((error as Error).message ?? 'AI Mentor is temporarily unavailable.');
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
  };

  return (
    <aside className="ai-mentor-drawer" data-testid="ai-mentor-drawer" aria-label="AI Mentor">
      <header className="ai-mentor-drawer__header">
        <h2 className="ai-mentor-drawer__title">AI Mentor</h2>
        <div className="ai-mentor-drawer__header-actions">
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clear}>
              Clear
            </Button>
          )}
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              ✕
            </Button>
          )}
        </div>
      </header>

      <div className="ai-mentor-drawer__history" ref={scrollRef}>
        {messages.length === 0 && !pendingText && (
          <p className="ai-mentor-drawer__empty">Ask me anything about this lesson or lab.</p>
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
            <span className="ai-mentor-drawer__typing" aria-label="AI Mentor is typing" />
          </div>
        )}
      </div>

      <footer className="ai-mentor-drawer__input-row">
        <textarea
          className="ai-mentor-drawer__input"
          value={input}
          maxLength={2000}
          rows={2}
          placeholder="Ask the AI Mentor…"
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              void send();
            }
          }}
        />
        <Button onClick={() => void send()} isLoading={isStreaming}>
          Send
        </Button>
      </footer>
    </aside>
  );
}

export default AiMentorDrawer;

import { getAccessToken } from '@/shared/services';
import { ENV } from '@/shared/constants';

export interface AiMentorStreamEvent {
  delta?: string;
  done?: boolean;
  error?: string;
}

export interface AiMentorSessionDto {
  sessionKey: string;
  contextLessonId: number;
  contextLabId: number | null;
  createdAt: string;
  ttlSeconds: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
}

/**
 * F6 §09 AI Mentor client. Uses the native `fetch` streaming API (no SSE
 * library) to consume the `text/event-stream` endpoint, yielding parsed
 * `data:` events so the drawer can append deltas as they arrive.
 */
export const aiMentorService = {
  async streamMessage(
    message: string,
    lessonId: number,
    labId?: number,
  ): Promise<AiMentorStreamEvent[]> {
    const response = await fetch(`${ENV.API_BASE_URL}/labs/ai-mentor/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAccessToken() ?? ''}`,
      },
      body: JSON.stringify({ message, lessonId, labId }),
    });

    if (!response.ok) {
      let message = 'AI Mentor is temporarily unavailable.';
      try {
        const body = (await response.json()) as { message?: string };
        message = body.message ?? message;
      } catch {
        // non-JSON error body; keep default
      }
      throw new Error(message);
    }

    if (!response.body) {
      return [];
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const events: AiMentorStreamEvent[] = [];
    let buffer = '';

    for (;;) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) {
          continue;
        }
        try {
          events.push(JSON.parse(trimmed.slice(5).trim()) as AiMentorStreamEvent);
        } catch {
          // malformed event frame; skip
        }
      }
    }
    return events;
  },
};

export default aiMentorService;

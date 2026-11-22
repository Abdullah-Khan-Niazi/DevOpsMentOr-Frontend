import { ENV } from '@/shared/constants';
import { isErrorCode, type ErrorCode } from '@/shared/constants/errorCodes';
import { getAccessToken } from '@/shared/services';
import { rotateAuthTokens } from '@/shared/services/apiClient';
import type { ApiError, ApiErrorDetail, ApiErrorKind } from '@/shared/types';

export interface AiMentorStreamEvent {
  delta?: string;
  done?: boolean;
  error?: string;
}

/**
 * Body of `POST /labs/ai-mentor/message` (strict on the server). Both ids are
 * optional: with neither the mentor runs in general mode (personal dashboard).
 */
export interface AiMentorMessageInput {
  message: string;
  lessonId?: number;
  labId?: number;
}

export interface AiMentorStreamHandlers {
  /** Called with each text delta as it arrives. */
  onDelta?: (text: string) => void;
  signal?: AbortSignal;
}

export type AiMentorErrorReason =
  'unauthorized' | 'forbidden' | 'rate_limited' | 'unavailable' | 'network' | 'failed';

/**
 * Typed AI Mentor failure. Shaped like `ApiError` so `getErrorMessage`,
 * `getRetryAfterSeconds` and `useRetryAfter` work on it unchanged.
 */
export class AiMentorError extends Error implements ApiError {
  readonly reason: AiMentorErrorReason;
  readonly kind: ApiErrorKind;
  readonly code: ErrorCode | null;
  readonly errors: ApiErrorDetail[];
  readonly retryAfterSeconds: number | null;
  readonly statusCode?: number;

  constructor(
    reason: AiMentorErrorReason,
    message: string,
    options: {
      statusCode?: number;
      code?: ErrorCode | null;
      errors?: ApiErrorDetail[];
      retryAfterSeconds?: number | null;
    } = {},
  ) {
    super(message);
    this.name = 'AiMentorError';
    this.reason = reason;
    this.kind = reason === 'network' ? 'network' : 'http';
    this.statusCode = options.statusCode;
    this.code = options.code ?? null;
    this.errors = options.errors ?? [];
    this.retryAfterSeconds = options.retryAfterSeconds ?? null;
  }
}

const ENDPOINT_PATH = '/labs/ai-mentor/message';

const DEFAULT_MESSAGE: Record<AiMentorErrorReason, string> = {
  unauthorized: 'Your session has expired. Sign in again to use the AI Mentor.',
  forbidden: 'You do not have access to the AI Mentor for this content.',
  rate_limited: 'The AI Mentor is busy. Try again shortly.',
  unavailable: 'AI Mentor is temporarily unavailable.',
  network: 'You appear to be offline.',
  failed: 'AI Mentor is temporarily unavailable.',
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function reasonForStatus(status: number): AiMentorErrorReason {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 429) return 'rate_limited';
  if (status === 503) return 'unavailable';
  return 'failed';
}

/** Maps a non-2xx response (JSON failure envelope) to a typed error. */
async function errorFromResponse(response: Response): Promise<AiMentorError> {
  const reason = reasonForStatus(response.status);
  const body: unknown = await response.json().catch(() => null);
  const envelope = isRecord(body) ? body : {};
  const errors = Array.isArray(envelope.errors) ? envelope.errors.filter(isRecord) : [];
  const first = errors[0];
  const code = isErrorCode(first?.code) ? first.code : null;

  const headerRetry = Number(response.headers.get('Retry-After'));
  const bodyRetry = first?.retryAfterSeconds;
  const retryAfterSeconds =
    typeof bodyRetry === 'number' && Number.isFinite(bodyRetry)
      ? Math.max(0, Math.ceil(bodyRetry))
      : Number.isFinite(headerRetry) && headerRetry >= 0
        ? Math.ceil(headerRetry)
        : null;

  return new AiMentorError(reason, nonEmptyString(envelope.message) ?? DEFAULT_MESSAGE[reason], {
    statusCode: response.status,
    code,
    errors: errors as ApiErrorDetail[],
    retryAfterSeconds: reason === 'rate_limited' ? retryAfterSeconds : null,
  });
}

function postMessage(
  input: AiMentorMessageInput,
  token: string | null,
  signal?: AbortSignal,
): Promise<Response> {
  return fetch(`${ENV.API_BASE_URL}${ENDPOINT_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    // Only the ids the caller set are sent (undefined keys are dropped).
    body: JSON.stringify({ message: input.message, lessonId: input.lessonId, labId: input.labId }),
    signal,
  });
}

/**
 * F6 §09 / C§11.8 AI Mentor client. Streams the `text/event-stream` reply with
 * `fetch` and reports each delta as it arrives. The bearer token comes from the
 * current session; on 401 the single-flight refresh runs once and the request
 * is retried with the rotated token.
 */
export const aiMentorService = {
  /** Resolves with the full reply text. Throws `AiMentorError` on every failure. */
  async streamMessage(
    input: AiMentorMessageInput,
    handlers: AiMentorStreamHandlers = {},
  ): Promise<string> {
    const { onDelta, signal } = handlers;

    let response: Response;
    try {
      response = await postMessage(input, getAccessToken(), signal);
      if (response.status === 401) {
        const tokens = await rotateAuthTokens();
        if (!tokens) {
          throw new AiMentorError('unauthorized', DEFAULT_MESSAGE.unauthorized, {
            statusCode: 401,
          });
        }
        response = await postMessage(input, tokens.accessToken, signal);
      }
    } catch (error) {
      if (error instanceof AiMentorError || signal?.aborted) throw error;
      throw new AiMentorError('network', DEFAULT_MESSAGE.network);
    }

    if (!response.ok) {
      throw await errorFromResponse(response);
    }
    if (!response.body) {
      throw new AiMentorError('failed', DEFAULT_MESSAGE.failed, { statusCode: response.status });
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let reply = '';

    try {
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          let event: AiMentorStreamEvent;
          try {
            event = JSON.parse(trimmed.slice(5).trim()) as AiMentorStreamEvent;
          } catch {
            continue; // malformed frame; skip
          }
          if (typeof event.error === 'string') {
            throw new AiMentorError(
              'failed',
              nonEmptyString(event.error) ?? DEFAULT_MESSAGE.failed,
            );
          }
          if (typeof event.delta === 'string' && event.delta.length > 0) {
            reply += event.delta;
            onDelta?.(event.delta);
          }
          if (event.done) return reply;
        }
      }
    } catch (error) {
      if (error instanceof AiMentorError || signal?.aborted) throw error;
      throw new AiMentorError('network', DEFAULT_MESSAGE.network);
    } finally {
      reader.releaseLock();
    }
    return reply;
  },
};

export default aiMentorService;

export interface AiMentorSessionDto {
  sessionKey: string;
  contextLessonId: number;
  contextLabId: number | null;
  createdAt: string;
  ttlSeconds: number;
  messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
}

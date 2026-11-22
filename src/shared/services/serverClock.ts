// Server clock offset. Client clocks drift, so countdowns to server deadlines
// (quiz attempts, lab environment expiry) use `serverClock.now()`. The offset is
// derived from the `Date` response header (exposed by the backend CORS config)
// and only applied when the drift exceeds 2 s (the header has 1 s resolution).

const MIN_SIGNIFICANT_OFFSET_MS = 2_000;

let offsetMs = 0;

export const serverClock = {
  /** Current time in ms, corrected towards the server clock. */
  now(): number {
    return Date.now() + offsetMs;
  },

  offsetMs(): number {
    return offsetMs;
  },

  /** Records the offset from a `Date` header value; ignores missing or invalid headers. */
  recordDateHeader(dateHeader: unknown): void {
    if (typeof dateHeader !== 'string' || dateHeader.length === 0) return;
    const serverMs = Date.parse(dateHeader);
    if (Number.isNaN(serverMs)) return;
    const measured = serverMs - Date.now();
    offsetMs = Math.abs(measured) > MIN_SIGNIFICANT_OFFSET_MS ? measured : 0;
  },
};

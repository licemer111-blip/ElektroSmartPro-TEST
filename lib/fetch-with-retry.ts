/**
 * Supabase fetch interceptor with exponential backoff retry.
 *
 * Retries up to 3 times on:
 *  - Network failures (ERR_CONNECTION_CLOSED, ERR_NETWORK_CHANGED, etc.)
 *  - HTTP 5xx responses (server unavailable / gateway errors)
 *
 * Delays: 500 ms → 1 000 ms → 2 000 ms
 */

const RETRY_DELAYS = [500, 1_000, 2_000] as const;

function isRetryableError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === "AbortError") return false;
  return error instanceof TypeError;
}

/**
 * Creates a `fetch`-compatible function that retries failed requests.
 *
 * @param onFinalFailure - Optional callback invoked once when all retries are
 *   exhausted. Use this to surface a user-facing notification.
 */
export function createRetryFetch(
  onFinalFailure?: () => void
): typeof globalThis.fetch {
  return async function retryFetch(
    input: Parameters<typeof globalThis.fetch>[0],
    init?: RequestInit
  ): Promise<Response> {
    let lastError: unknown;
    let lastResponse: Response | undefined;

    for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
      try {
        const response = await globalThis.fetch(input, init);

        // 2xx / 3xx / 4xx — return immediately; only 5xx are retried.
        if (response.status < 500) return response;

        lastResponse = response;
        lastError = new Error(`HTTP ${response.status}: ${response.statusText}`);
      } catch (error) {
        if (!isRetryableError(error)) throw error;
        lastError = error;
        lastResponse = undefined;
      }

      if (attempt < RETRY_DELAYS.length) {
        await new Promise<void>((resolve) =>
          setTimeout(resolve, RETRY_DELAYS[attempt])
        );
      }
    }

    onFinalFailure?.();

    if (lastResponse) return lastResponse;
    throw lastError;
  };
}

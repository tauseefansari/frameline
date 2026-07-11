/**
 * Centralized API surface for the Frameline studio client. Every fetch from a
 * React component or hook MUST go through {@link apiFetch} + {@link ENDPOINTS}
 * — never hardcode a URL string. This keeps the client/server contract in one
 * place and lets us swap base origins (e.g. for a future split deployment)
 * without touching feature code.
 */

/**
 * Every server endpoint the studio talks to. Keep paths in sync with the
 * `app/api/**\/route.ts` files.
 */
export const ENDPOINTS = {
  script: "/api/script",
  tts: "/api/tts",
  ttsSync: "/api/tts/sync",
  ttsPreview: "/api/tts/preview",
  videoCut: "/api/video/cut",
  videoClip: "/api/video/clip",
  videoConcat: "/api/video/concat",
  videoRender: "/api/video/render",
} as const;

export type EndpointKey = keyof typeof ENDPOINTS;
export type EndpointPath = (typeof ENDPOINTS)[EndpointKey];

/** Build an absolute (or same-origin) URL for the given endpoint. */
export function buildApiUrl(endpoint: EndpointPath, query?: Record<string, string>): string {
  if (!query) return endpoint;
  const params = new URLSearchParams(query);
  const qs = params.toString();
  return qs ? `${endpoint}?${qs}` : endpoint;
}

/**
 * Pull the localized error message from a non-OK JSON response. The Frameline
 * route helpers always serialize errors as `{ error: string, code: string }`.
 */
async function readErrorMessage(res: Response, fallback: string): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string };
    return data.error ?? fallback;
  } catch {
    return fallback;
  }
}

export type ApiFetchOptions = RequestInit & {
  /** Optional query parameters appended to the endpoint URL. */
  query?: Record<string, string>;
  /** Localized error message to throw when the server doesn't return one. */
  fallbackError: string;
};

/**
 * Wrap `fetch` so every call funnels through one place: URL construction,
 * shared error parsing, and a consistent thrown `Error` on failure. Returns
 * the raw `Response` so callers decide between `.blob()`, `.json()`, etc.
 */
export async function apiFetch(
  endpoint: EndpointPath,
  options: ApiFetchOptions,
): Promise<Response> {
  const { fallbackError, query, ...init } = options;
  const url = buildApiUrl(endpoint, query);
  const res = await fetch(url, init);
  if (!res.ok) {
    throw new Error(await readErrorMessage(res, fallbackError));
  }
  return res;
}

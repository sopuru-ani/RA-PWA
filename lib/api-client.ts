/**
 * API helpers for the Express backend.
 * Uses Bearer token in sessionStorage when cookies cannot cross origins
 * (e.g. https://localhost:3000 → http://localhost:4000).
 */

const AUTH_TOKEN_KEY = "auth_token";

export function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL_LAN ?? "";
}

export function setAuthToken(token: string): void {
  sessionStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

/** Fetch against the Express API with auth header when a token is stored */
export async function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const base = getApiBaseUrl();
  const url = path.startsWith("http") ? path : `${base}${path}`;

  const headers = new Headers(init.headers);
  const token = getAuthToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });
}

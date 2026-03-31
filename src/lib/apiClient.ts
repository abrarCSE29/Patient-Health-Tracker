let accessToken: string | null = null;
let refreshHandler: (() => Promise<string | null>) | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshHandler(handler: (() => Promise<string | null>) | null) {
  refreshHandler = handler;
}

function withAuthHeaders(init: RequestInit = {}): RequestInit {
  const headers = new Headers(init.headers || {});
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return {
    ...init,
    headers,
    credentials: "include",
  };
}

export async function authenticatedFetch(input: RequestInfo | URL, init: RequestInit = {}, retry = true): Promise<Response> {
  const response = await fetch(input, withAuthHeaders(init));

  const url = typeof input === "string" ? input : input.toString();
  const isAuthRoute = url.includes("/api/auth/");

  if (response.status === 401 && retry && !isAuthRoute && refreshHandler) {
    const newToken = await refreshHandler();
    if (newToken) {
      return authenticatedFetch(input, init, false);
    }
  }

  return response;
}

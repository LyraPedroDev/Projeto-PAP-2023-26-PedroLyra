export async function apiFetch(input: RequestInfo | URL, init?: RequestInit) {
  const send = () =>
    fetch(input, {
      ...init,
      credentials: 'include',
      headers: {
        ...(init?.headers || {}),
      },
    });

  let response = await send();
  if (response.status !== 401) return response;

  const refreshResponse = await fetch('/api/auth/refresh', {
    method: 'POST',
    credentials: 'include',
  });

  if (!refreshResponse.ok) return response;
  response = await send();
  return response;
}

export async function apiJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await apiFetch(input, init);
  if (!response.ok) {
    throw new Error(`HTTP_${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function apiTryJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T | null> {
  const response = await apiFetch(input, init);
  if (!response.ok) return null;
  return response.json() as Promise<T>;
}

export interface ApiError extends Error {
  status: number;
  body?: {
    message?: string;
    [key: string]: unknown;
  };
}

export class ApiRequestError extends Error implements ApiError {
  status: number;
  body?: { message?: string; [key: string]: unknown };

  constructor(message: string, status: number, body?: { message?: string; [key: string]: unknown }) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...options,
    credentials: 'include'
  });
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const message = (body && typeof body === 'object' && body.message) || 'Request failed';
    throw new ApiRequestError(message, res.status, typeof body === 'object' ? body : undefined);
  }
  return body as T;
}

export const Api = {
  get: <T>(url: string) => apiFetch<T>(url),
  post: <T>(url: string, data?: unknown) =>
    apiFetch<T>(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    }),
  put: <T>(url: string, data?: unknown) =>
    apiFetch<T>(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: data ? JSON.stringify(data) : undefined
    }),
  delete: <T>(url: string) =>
    apiFetch<T>(url, { method: 'DELETE' })
};

export class ApiRequestError extends Error {}

export function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback
}

export async function requestJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')

  const response = await fetch(url, { ...init, headers })
  const body = response.status === 204 ? undefined : await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiRequestError(body?.error || 'Something went wrong. Please try again.')
  }

  return body as T
}

export function getErrorMessageFromJson(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const maybe = data as Record<string, unknown>;
  return typeof maybe.error === "string" ? maybe.error : null;
}

export async function fetchJson<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(input, init);

  const text = await res.text();

  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    // leave as null
  }

  if (!res.ok) {
    throw new Error(
      getErrorMessageFromJson(data) || text || `Request failed (${res.status})`,
    );
  }

  return data as T;
}

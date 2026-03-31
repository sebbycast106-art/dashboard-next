export async function api(path: string, options: RequestInit = {}): Promise<any> {
  const url = `/api${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    },
    ...options,
  });

  if (res.status === 401) {
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "Request failed");
    try {
      const json = JSON.parse(text);
      throw new Error(json.error || json.message || text || `HTTP ${res.status}`);
    } catch (e) {
      if (e instanceof SyntaxError) throw new Error(text || `HTTP ${res.status}`);
      throw e;
    }
  }

  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return res.json();
  }
  return res.text();
}

export function post(path: string, body?: unknown): Promise<any> {
  return api(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function patch(path: string, body?: unknown): Promise<any> {
  return api(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

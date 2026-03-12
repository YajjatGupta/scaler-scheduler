const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
};

export async function api<T>(path: string, options: RequestOptions = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json"
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Request failed." }));
    throw new Error(error.message || "Request failed.");
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

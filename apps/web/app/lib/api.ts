"use client";

export type ApiResult<T> = {
  ok: boolean;
  data?: T;
  message?: string;
  unavailable?: boolean;
};

const TOKEN_KEY = "omo-iya-exchange-access-token";

export function getApiBase() {
  return process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "";
}

export function apiConfigured() {
  return getApiBase().length > 0 || Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function getAccessToken() {
  if (typeof window === "undefined") return "";
  return window.localStorage.getItem(TOKEN_KEY) || "";
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const base = getApiBase();
  if (!base && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { ok: false, unavailable: true, message: "API URL is not configured." };
  }

  try {
    const token = getAccessToken();
    const response = await fetch(`${base}${path}`, {
      ...options,
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    const body = await response.json().catch(() => ({}));

    return {
      ok: response.ok && body.success !== false,
      data: body.data,
      message: body.message,
    };
  } catch (error) {
    return {
      ok: false,
      unavailable: true,
      message: error instanceof Error ? error.message : "API request failed.",
    };
  }
}

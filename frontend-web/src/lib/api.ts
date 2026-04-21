"use client";

import { getToken, clearAuth } from "./auth";
import type { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";
import type { User } from "@/types/user";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_BASE_URL environment variable");
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface ApiRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  cache?: RequestCache;
  signal?: AbortSignal;
  useAuthHeader?: boolean;
}

function buildHeaders(
  token: string | null,
  headers?: HeadersInit,
  useAuthHeader: boolean = false
): Headers {
  const resolvedHeaders = new Headers(headers);

  if (!resolvedHeaders.has("Content-Type")) {
    resolvedHeaders.set("Content-Type", "application/json");
  }

  if (useAuthHeader && token && !resolvedHeaders.has("Authorization")) {
    resolvedHeaders.set("Authorization", `Bearer ${token}`);
  }

  return resolvedHeaders;
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

function normalizePath(path: string): string {
  if (!path) return "";
  return path.startsWith("/") ? path : `/${path}`;
}

function extractErrorMessage(
  payload: unknown,
  fallbackMessage: string
): string {
  if (
    payload &&
    typeof payload === "object" &&
    "message" in payload &&
    typeof (payload as { message?: unknown }).message === "string"
  ) {
    return (payload as { message: string }).message;
  }

  return fallbackMessage;
}

export class ApiRequestError extends Error {
  public readonly status: number;
  public readonly payload: ApiErrorResponse | unknown;

  constructor(
    message: string,
    status: number,
    payload: ApiErrorResponse | unknown
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {}
): Promise<ApiSuccessResponse<T>> {
  const token = getToken();
  const url = `${API_BASE_URL}${normalizePath(path)}`;

  const response = await fetch(url, {
    method: options.method ?? "GET",
    headers: buildHeaders(token, options.headers, options.useAuthHeader ?? false),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    cache: options.cache ?? "no-store",
    signal: options.signal,
    credentials: "include"
  });

  const payload = await parseJsonSafely(response);

  if (!response.ok) {
    if (response.status === 401) {
      clearAuth();
    }

    const fallbackMessage = `Request failed with status ${response.status}`;
    const message = extractErrorMessage(payload, fallbackMessage);

    throw new ApiRequestError(message, response.status, payload);
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("success" in payload)
  ) {
    throw new ApiRequestError(
      "Invalid API response format",
      response.status,
      payload
    );
  }

  return payload as ApiSuccessResponse<T>;
}

export interface AdminCreateUserPayload {
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  city?: string;
  country?: string;
  userType: string;
  roles: string[];
  accountStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export interface AdminUpdateUserPayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  city?: string;
  country?: string;
  userType?: string;
  accountStatus?: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

export async function createUser(body: AdminCreateUserPayload) {
  return apiRequest<User>("/admin/users", { method: "POST", body });
}

export async function updateUser(userId: string, body: AdminUpdateUserPayload) {
  return apiRequest<User>(`/admin/users/${userId}`, { method: "PUT", body });
}

export async function updateUserStatus(userId: string, accountStatus: string) {
  return apiRequest<User>(`/admin/users/${userId}/status`, {
    method: "PUT",
    body: { accountStatus }
  });
}

export async function fetchAdminUser(userId: string) {
  return apiRequest<User>(`/admin/users/${userId}`, { method: "GET" });
}

export const api = {
  get<T>(
    path: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return apiRequest<T>(path, { ...options, method: "GET" });
  },

  post<T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return apiRequest<T>(path, { ...options, method: "POST", body });
  },

  put<T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return apiRequest<T>(path, { ...options, method: "PUT", body });
  },

  patch<T>(
    path: string,
    body?: unknown,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return apiRequest<T>(path, { ...options, method: "PATCH", body });
  },

  delete<T>(
    path: string,
    options: Omit<ApiRequestOptions, "method" | "body"> = {}
  ) {
    return apiRequest<T>(path, { ...options, method: "DELETE" });
  }
};
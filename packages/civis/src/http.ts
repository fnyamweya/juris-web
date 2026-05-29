import { CivisApiError } from "./error";
import type { CivisApiErrorBody } from "./error";

type CivisResponse<T> = {
  data: T;
  request?: { requestId: string; correlationId: string };
};

type CivisListResponse<T> = {
  data: T[];
  meta: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
  request?: { requestId: string; correlationId: string };
};

export type HttpConfig = {
  baseUrl: string;
  accessToken: string;
  tenantId?: string | undefined;
};

async function parseError(res: Response): Promise<CivisApiError> {
  try {
    const body = (await res.json()) as { error?: CivisApiErrorBody };
    if (body.error) return new CivisApiError(res.status, body.error);
  } catch {
    // fallthrough
  }
  return new CivisApiError(res.status, {
    code: "UNKNOWN_ERROR",
    message: `HTTP ${res.status}`,
  });
}

export function createHttp(config: HttpConfig) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.accessToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
  if (config.tenantId) {
    headers["X-Civis-Tenant-Id"] = config.tenantId;
  }

  async function get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<CivisResponse<T>> {
    const url = new URL(`${config.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<CivisResponse<T>>;
  }

  async function list<T>(path: string, params?: Record<string, string | number | undefined>): Promise<CivisListResponse<T>> {
    const url = new URL(`${config.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<CivisListResponse<T>>;
  }

  async function post<T>(path: string, body?: unknown): Promise<CivisResponse<T> | null> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (res.status === 204) return null;
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<CivisResponse<T>>;
  }

  async function put<T>(path: string, body?: unknown): Promise<CivisResponse<T>> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "PUT",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<CivisResponse<T>>;
  }

  async function patch<T>(path: string, body?: unknown): Promise<CivisResponse<T>> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "PATCH",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<CivisResponse<T>>;
  }

  async function del(path: string): Promise<void> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "DELETE",
      headers,
    });
    if (!res.ok) throw await parseError(res);
  }

  return { get, list, post, put, patch, del };
}

export type Http = ReturnType<typeof createHttp>;

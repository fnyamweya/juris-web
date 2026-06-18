import { CivisApiError } from "./error";
import type { CivisApiErrorBody } from "./error";

type CivisResponse<T> = {
  data: T;
  request?: { requestId: string; correlationId: string };
};

type CivisListResponse<T> = {
  data: T[];
  meta?: {
    limit: number;
    nextCursor: string | null;
    hasMore: boolean;
    total?: number;
  };
  pagination?: {
    limit: number;
    nextCursor: string | null;
    hasNext: boolean;
    total?: number;
  };
  request?: { requestId: string; correlationId: string };
};

type EmptySuccess = null;

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

async function parseResponse<T>(
  res: Response,
): Promise<CivisResponse<T> | EmptySuccess> {
  if (res.status === 204) return null;

  const text = await res.text();
  if (!text.trim()) return null;

  const payload = JSON.parse(text) as CivisResponse<T> | T;
  if (payload && typeof payload === "object" && "data" in payload) {
    return payload;
  }
  return { data: payload };
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

  function buildUrl(
    path: string,
    params?: Record<string, boolean | string | number | undefined>,
  ) {
    const url = new URL(`${config.baseUrl}${path}`);
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined) url.searchParams.set(k, String(v));
      }
    }
    return url.toString();
  }

  async function get<T>(
    path: string,
    params?: Record<string, boolean | string | number | undefined>,
  ): Promise<CivisResponse<T>> {
    const res = await fetch(buildUrl(path, params), { headers });
    if (!res.ok) throw await parseError(res);
    const body = (await res.json()) as CivisResponse<T> | T;
    if (body && typeof body === "object" && "data" in body) {
      return body;
    }
    return { data: body };
  }

  async function list<T>(
    path: string,
    params?: Record<string, boolean | string | number | undefined>,
  ): Promise<Required<Pick<CivisListResponse<T>, "data" | "meta">>> {
    const res = await fetch(buildUrl(path, params), { headers });
    if (!res.ok) throw await parseError(res);
    const body = (await res.json()) as CivisListResponse<T> | T[];
    if (Array.isArray(body)) {
      return {
        data: body,
        meta: {
          limit: body.length,
          nextCursor: null,
          hasMore: false,
        },
      };
    }
    const meta = body.meta ?? {
      limit: body.pagination?.limit ?? body.data.length,
      nextCursor: body.pagination?.nextCursor ?? null,
      hasMore: body.pagination?.hasNext ?? false,
      ...(body.pagination?.total !== undefined
        ? { total: body.pagination.total }
        : {}),
    };
    return { data: body.data, meta };
  }

  async function post<T>(
    path: string,
    body?: unknown,
  ): Promise<CivisResponse<T> | null> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "POST",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw await parseError(res);
    return parseResponse<T>(res);
  }

  async function put<T>(
    path: string,
    body?: unknown,
  ): Promise<CivisResponse<T>> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "PUT",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw await parseError(res);
    const payload = await parseResponse<T>(res);
    return payload ?? { data: undefined as T };
  }

  async function patch<T>(
    path: string,
    body?: unknown,
  ): Promise<CivisResponse<T>> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method: "PATCH",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw await parseError(res);
    const payload = await parseResponse<T>(res);
    return payload ?? { data: undefined as T };
  }

  async function del<T = never>(
    path: string,
    params?: Record<string, boolean | string | number | undefined>,
    body?: unknown,
  ): Promise<CivisResponse<T> | null> {
    const res = await fetch(buildUrl(path, params), {
      method: "DELETE",
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    if (!res.ok) throw await parseError(res);
    return parseResponse<T>(res);
  }

  return { get, list, post, put, patch, del };
}

export type Http = ReturnType<typeof createHttp>;

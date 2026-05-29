export type CivisErrorCategory =
  | "AUTHENTICATION"
  | "AUTHORIZATION"
  | "VALIDATION"
  | "REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "SERVER"
  | "RATE_LIMITED";

export type CivisApiViolation = {
  field: string;
  message: string;
  code: string;
};

export type CivisApiErrorBody = {
  code: string;
  message: string;
  details?: {
    category?: CivisErrorCategory;
    retryable?: boolean;
    violations?: CivisApiViolation[];
  };
};

export class CivisApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly category: CivisErrorCategory | undefined;
  readonly violations: CivisApiViolation[];
  readonly retryable: boolean;

  constructor(status: number, body: CivisApiErrorBody) {
    super(body.message);
    this.name = "CivisApiError";
    this.status = status;
    this.code = body.code;
    this.category = body.details?.category;
    this.violations = body.details?.violations ?? [];
    this.retryable = body.details?.retryable ?? false;
  }

  get isUnauthorized() {
    return this.status === 401;
  }

  get isForbidden() {
    return this.status === 403;
  }

  get isNotFound() {
    return this.status === 404;
  }

  get isMfaRequired() {
    return this.status === 428;
  }
}

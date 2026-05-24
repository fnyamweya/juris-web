export type RequestContext = {
  requestId: string;
  correlationId: string;
  traceId?: string;
  locale?: string;
  tenantId?: string;
  userIdHash?: string;
  routeGroup?: string;
};

export function createRequestContext(
  init: Partial<RequestContext> = {},
): RequestContext {
  const requestId = init.requestId ?? crypto.randomUUID();
  const context: RequestContext = {
    requestId,
    correlationId: init.correlationId ?? requestId,
  };

  if (init.traceId) {
    context.traceId = init.traceId;
  }
  if (init.locale) {
    context.locale = init.locale;
  }
  if (init.tenantId) {
    context.tenantId = init.tenantId;
  }
  if (init.userIdHash) {
    context.userIdHash = init.userIdHash;
  }
  if (init.routeGroup) {
    context.routeGroup = init.routeGroup;
  }

  return context;
}

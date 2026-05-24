import { z } from "zod";

export const ApiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.unknown().optional(),
});

export const ApiMetaSchema = z.object({
  requestId: z.string().optional(),
  traceId: z.string().optional(),
});

export const ApiEnvelopeSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  error: ApiErrorSchema.optional(),
  meta: ApiMetaSchema.optional(),
});

export type ApiError = z.infer<typeof ApiErrorSchema>;
export type ApiMeta = z.infer<typeof ApiMetaSchema>;
export type ApiEnvelope<T> = {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ApiMeta;
};

export function createSuccessEnvelope<T>(
  data: T,
  meta?: ApiMeta,
): ApiEnvelope<T> {
  const envelope: ApiEnvelope<T> = {
    success: true,
    data,
  };

  if (meta) {
    envelope.meta = meta;
  }

  return envelope;
}

export function createErrorEnvelope(
  error: ApiError,
  meta?: ApiMeta,
): ApiEnvelope<never> {
  const envelope: ApiEnvelope<never> = {
    success: false,
    error,
  };

  if (meta) {
    envelope.meta = meta;
  }

  return envelope;
}

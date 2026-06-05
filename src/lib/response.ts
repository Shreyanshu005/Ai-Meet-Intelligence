// src/lib/response.ts
export const ok = <T>(data: T, traceId: string) => ({
  traceId,
  success: true,
  data,
});

export const fail = (code: string, message: string, traceId: string) => ({
  traceId,
  success: false,
  error: { code, message },
});

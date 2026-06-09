# Issue 3: Error Handling & Observability

## Audit summary

Handlers previously used five inconsistent strategies: success envelopes, silent swallows, thrown errors, unhandled propagation, and optional-auth ignores.

## Unified approach

- `AppError` taxonomy in `apps/api/src/lib/errors.ts` maps messages to gRPC status codes.
- `runGrpcHandler()` / `runGrpcMutation()` in `handler-utils.ts` provide structured logging and consistent error mapping.
- Trace IDs via AsyncLocalStorage + gRPC server interceptor (`x-trace-id` response metadata).
- Structured JSON logs include `traceId`, `service`, `method`, `durationMs`, and `errorCode`.

## Contract preservation

Read endpoints that previously returned empty defaults on auth failure still do (bookmarks, notifications, likes status). Mutation endpoints return `{ success: false, error }`.

import { classifyError } from "../lib/errors";
import { logger } from "../lib/logger";
import { createTraceId, getTraceId, runWithTrace } from "../lib/tracing";

export interface MutationResult {
	success: boolean;
	error?: string;
}

export interface HandlerOptions {
	service: string;
	method: string;
}

export interface MutationHandlerOptions extends HandlerOptions {
	/** Preserved proto fields returned alongside success: false */
	errorDefaults?: Record<string, unknown>;
	/** Message when a non-Error value is thrown */
	unknownErrorMessage?: string;
}

function formatMutationError(error: unknown, unknownErrorMessage?: string): string {
	if (error instanceof Error) {
		return error.message;
	}
	return unknownErrorMessage ?? "Internal server error";
}

/**
 * Wraps gRPC handler methods with trace IDs, structured logging, and unified error mapping.
 */
export async function runGrpcHandler<T>(
	options: HandlerOptions,
	handler: () => Promise<T>,
): Promise<T> {
	const traceId = createTraceId();
	const start = Date.now();

	return runWithTrace({ traceId, service: options.service, method: options.method }, async () => {
		logger.info("gRPC request started", {
			traceId,
			service: options.service,
			method: options.method,
		});

		try {
			const result = await handler();
			logger.info("gRPC request completed", {
				traceId,
				service: options.service,
				method: options.method,
				durationMs: Date.now() - start,
			});
			return result;
		} catch (error) {
			const appError = classifyError(error);
			logger.error("gRPC request failed", {
				traceId,
				service: options.service,
				method: options.method,
				durationMs: Date.now() - start,
				errorCode: appError.code,
				error: appError.message,
			});
			throw appError;
		}
	});
}

export async function runGrpcMutation<T extends MutationResult>(
	options: MutationHandlerOptions,
	handler: () => Promise<T>,
): Promise<T> {
	const traceId = createTraceId();
	const start = Date.now();

	return runWithTrace({ traceId, service: options.service, method: options.method }, async () => {
		logger.info("gRPC mutation started", {
			traceId,
			service: options.service,
			method: options.method,
		});

		try {
			const result = await handler();
			logger.info("gRPC mutation completed", {
				traceId,
				service: options.service,
				method: options.method,
				durationMs: Date.now() - start,
			});
			return result;
		} catch (error) {
			const message = formatMutationError(error, options.unknownErrorMessage);
			const appError = classifyError(error instanceof Error ? error : new Error(message));
			logger.error("gRPC mutation failed", {
				traceId,
				service: options.service,
				method: options.method,
				durationMs: Date.now() - start,
				errorCode: appError.code,
				error: message,
			});
			return {
				...(options.errorDefaults ?? {}),
				success: false,
				error: message,
			} as T;
		}
	});
}

export function getCurrentTraceId(): string {
	return getTraceId();
}

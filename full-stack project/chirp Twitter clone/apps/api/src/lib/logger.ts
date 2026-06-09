import { getTraceId } from "./tracing";

export type LogLevel = "info" | "warn" | "error" | "debug";

export interface LogContext {
	traceId?: string;
	service?: string;
	method?: string;
	userId?: string;
	durationMs?: number;
	errorCode?: string;
	[key: string]: unknown;
}

export function log(level: LogLevel, message: string, context: LogContext = {}): void {
	const entry = {
		level,
		message,
		timestamp: new Date().toISOString(),
		traceId: context.traceId ?? getTraceId(),
		...context,
	};

	const line = JSON.stringify(entry);
	if (level === "error") {
		console.error(line);
	} else if (level === "warn") {
		console.warn(line);
	} else {
		console.log(line);
	}
}

export const logger = {
	info: (message: string, context?: LogContext) => log("info", message, context),
	warn: (message: string, context?: LogContext) => log("warn", message, context),
	error: (message: string, context?: LogContext) => log("error", message, context),
	debug: (message: string, context?: LogContext) => log("debug", message, context),
};

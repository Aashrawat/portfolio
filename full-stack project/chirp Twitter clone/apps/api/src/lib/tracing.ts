import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";

export interface TraceContext {
	traceId: string;
	method?: string;
	service?: string;
}

const traceStorage = new AsyncLocalStorage<TraceContext>();

export function getTraceContext(): TraceContext | undefined {
	return traceStorage.getStore();
}

export function getTraceId(): string {
	return getTraceContext()?.traceId ?? "no-trace";
}

export function runWithTrace<T>(
	context: Omit<TraceContext, "traceId"> & { traceId?: string },
	fn: () => T | Promise<T>,
): Promise<T> {
	const traceId = context.traceId ?? randomUUID();
	return Promise.resolve(traceStorage.run({ ...context, traceId }, fn));
}

export function createTraceId(): string {
	return randomUUID();
}

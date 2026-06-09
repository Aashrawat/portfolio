import { status as GrpcStatus } from "@grpc/grpc-js";

export enum ErrorCode {
	UNAUTHENTICATED = "UNAUTHENTICATED",
	PERMISSION_DENIED = "PERMISSION_DENIED",
	NOT_FOUND = "NOT_FOUND",
	INVALID_ARGUMENT = "INVALID_ARGUMENT",
	CONFLICT = "CONFLICT",
	INTERNAL = "INTERNAL",
	BANNED = "BANNED",
}

const MESSAGE_PATTERNS: Array<{ pattern: RegExp; code: ErrorCode; grpcStatus: number }> = [
	{
		pattern: /authentication required|invalid or expired session/i,
		code: ErrorCode.UNAUTHENTICATED,
		grpcStatus: GrpcStatus.UNAUTHENTICATED,
	},
	{
		pattern: /admin access required|super admin access required|permission/i,
		code: ErrorCode.PERMISSION_DENIED,
		grpcStatus: GrpcStatus.PERMISSION_DENIED,
	},
	{ pattern: /not found/i, code: ErrorCode.NOT_FOUND, grpcStatus: GrpcStatus.NOT_FOUND },
	{
		pattern: /already exists|already taken|duplicate/i,
		code: ErrorCode.CONFLICT,
		grpcStatus: GrpcStatus.ALREADY_EXISTS,
	},
	{ pattern: /account banned/i, code: ErrorCode.BANNED, grpcStatus: GrpcStatus.PERMISSION_DENIED },
	{
		pattern: /required|must be|invalid|expired|too long|too many/i,
		code: ErrorCode.INVALID_ARGUMENT,
		grpcStatus: GrpcStatus.INVALID_ARGUMENT,
	},
];

export class AppError extends Error {
	constructor(
		message: string,
		public readonly code: ErrorCode,
		public readonly grpcStatus: number = GrpcStatus.INTERNAL,
	) {
		super(message);
		this.name = "AppError";
	}
}

export function classifyError(error: unknown): AppError {
	if (error instanceof AppError) {
		return error;
	}

	const message = error instanceof Error ? error.message : "Internal server error";
	for (const rule of MESSAGE_PATTERNS) {
		if (rule.pattern.test(message)) {
			return new AppError(message, rule.code, rule.grpcStatus);
		}
	}

	return new AppError(message, ErrorCode.INTERNAL, GrpcStatus.INTERNAL);
}

export function toMutationError(error: unknown): {
	success: false;
	error: string;
	traceId: string;
} {
	const appError = classifyError(error);
	return {
		success: false,
		error: appError.message,
		traceId: "", // filled by caller
	};
}

export function toGrpcError(error: unknown): Error {
	const appError = classifyError(error);
	const grpcError = new Error(appError.message);
	(grpcError as Error & { code: number }).code = appError.grpcStatus;
	return grpcError;
}

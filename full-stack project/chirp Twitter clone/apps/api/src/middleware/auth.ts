import type { GrpcSessionPayload } from "@chirp/shared-types";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { db, schema } from "../db";

const { users } = schema;

function getJwtSecret(): string {
	const secret = process.env.GRPC_JWT_SECRET;
	if (!secret) {
		if (process.env.NODE_ENV === "production") {
			throw new Error("GRPC_JWT_SECRET environment variable is required in production");
		}
		// Development/test fallback only
		return "chirp-grpc-jwt-secret-key-at-least-32-chars";
	}
	return secret;
}

export interface AuthContext {
	userId: string;
	username: string;
	role: "user" | "admin" | "moderator";
}

/**
 * Verifies JWT signature and extracts claims. Role in the token is NOT trusted for authorization.
 */
export function validateSessionToken(token: string): AuthContext {
	try {
		const decoded = jwt.verify(token, getJwtSecret()) as GrpcSessionPayload;
		return {
			userId: decoded.userId,
			username: decoded.username,
			role: decoded.role,
		};
	} catch {
		throw new Error("Invalid or expired session token");
	}
}

/**
 * Resolves auth context from token with role loaded from the database.
 * Prevents client-forged JWT role escalation.
 */
export async function resolveAuthContext(token: string): Promise<AuthContext> {
	const tokenClaims = validateSessionToken(token);

	const user = await db
		.select({
			id: users.id,
			username: users.username,
			role: users.role,
			bannedAt: users.bannedAt,
			bannedReason: users.bannedReason,
		})
		.from(users)
		.where(eq(users.id, tokenClaims.userId))
		.get();

	if (!user) {
		throw new Error("Invalid or expired session token");
	}

	if (user.bannedAt) {
		throw new Error(`Account banned: ${user.bannedReason || "No reason provided"}`);
	}

	return {
		userId: user.id,
		username: user.username,
		role: user.role as AuthContext["role"],
	};
}

/**
 * Creates a session token from auth context (API-only — clients must not re-sign tokens).
 */
export function createSessionToken(
	context: AuthContext,
	expiresInSeconds: number = 7 * 24 * 60 * 60,
): string {
	return jwt.sign(
		{
			userId: context.userId,
			username: context.username,
			role: context.role,
		},
		getJwtSecret(),
		{ expiresIn: expiresInSeconds },
	);
}

/**
 * Requires authentication - throws if token is invalid
 */
export async function requireAuth(token: string | undefined): Promise<AuthContext> {
	if (!token) {
		throw new Error("Authentication required");
	}
	return resolveAuthContext(token);
}

/**
 * Requires admin or moderator role (role verified from database)
 */
export async function requireAdmin(token: string | undefined): Promise<AuthContext> {
	const auth = await requireAuth(token);
	if (auth.role !== "admin" && auth.role !== "moderator") {
		throw new Error("Admin access required");
	}
	return auth;
}

/**
 * Requires admin role specifically (role verified from database)
 */
export async function requireSuperAdmin(token: string | undefined): Promise<AuthContext> {
	const auth = await requireAuth(token);
	if (auth.role !== "admin") {
		throw new Error("Super admin access required");
	}
	return auth;
}

/** @deprecated Use resolveAuthContext — kept for sync call sites that only need userId */
export function requireAuthSync(token: string | undefined): AuthContext {
	if (!token) {
		throw new Error("Authentication required");
	}
	return validateSessionToken(token);
}

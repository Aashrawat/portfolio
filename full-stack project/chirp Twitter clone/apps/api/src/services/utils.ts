import bcrypt from "bcrypt";
import { createHash } from "crypto";

const BCRYPT_ROUNDS = 12;
const LEGACY_SHA256_PREFIX = "sha256:";

/**
 * Generate a simple ID
 */
export function generateId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

function legacySha256Hash(password: string): string {
	const hash = createHash("sha256");
	hash.update(password + "salt");
	return hash.digest("hex");
}

function isBcryptHash(storedHash: string): boolean {
	return storedHash.startsWith("$2");
}

function isLegacySha256Hash(storedHash: string): boolean {
	return storedHash.startsWith(LEGACY_SHA256_PREFIX);
}

/**
 * Hash password using bcrypt (production-safe).
 */
export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export interface PasswordVerificationResult {
	valid: boolean;
	needsUpgrade: boolean;
	upgradedHash?: string;
}

/**
 * Verify password with backwards-compatible legacy SHA-256 migration.
 * Seeded users keep working; successful legacy login returns upgraded bcrypt hash.
 */
export async function verifyPassword(
	password: string,
	storedHash: string,
): Promise<PasswordVerificationResult> {
	if (isBcryptHash(storedHash)) {
		const valid = await bcrypt.compare(password, storedHash);
		return { valid, needsUpgrade: false };
	}

	let legacyHex = storedHash;
	if (isLegacySha256Hash(storedHash)) {
		legacyHex = storedHash.slice(LEGACY_SHA256_PREFIX.length);
	}

	const legacyMatch = legacySha256Hash(password) === legacyHex;
	if (!legacyMatch) {
		return { valid: false, needsUpgrade: false };
	}

	return {
		valid: true,
		needsUpgrade: true,
		upgradedHash: await hashPassword(password),
	};
}

/**
 * Convert Date to protobuf Timestamp
 */
export function toProtoTimestamp(date: Date): { seconds: bigint; nanos: number } {
	const ms = date.getTime();
	return {
		seconds: BigInt(Math.floor(ms / 1000)),
		nanos: (ms % 1000) * 1000000,
	};
}

/**
 * Convert protobuf Timestamp to Date
 */
export function fromProtoTimestamp(timestamp: { seconds: bigint; nanos: number }): Date {
	return new Date(Number(timestamp.seconds) * 1000 + timestamp.nanos / 1000000);
}

/** @internal Exposed for security tests documenting the legacy vulnerability. */
export function legacyHashPasswordForTests(password: string): string {
	return `${LEGACY_SHA256_PREFIX}${legacySha256Hash(password)}`;
}

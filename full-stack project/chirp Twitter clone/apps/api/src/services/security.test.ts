import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { describe, expect, it } from "vitest";
import { db, schema } from "../db";
import { resolveAuthContext } from "../middleware/auth";
import { loginUser, registerUser } from "./auth.service";
import { hashPassword, legacyHashPasswordForTests, verifyPassword } from "./utils";

const { users } = schema;

describe("Credential security", () => {
	it("documents legacy SHA-256 weakness and verifies bcrypt upgrade path", async () => {
		const legacyHash = legacyHashPasswordForTests("password123");
		expect(legacyHash.startsWith("sha256:")).toBe(true);

		const verification = await verifyPassword("password123", legacyHash);
		expect(verification.valid).toBe(true);
		expect(verification.needsUpgrade).toBe(true);
		expect(verification.upgradedHash?.startsWith("$2")).toBe(true);
	});

	it("stores bcrypt hashes for newly registered users", async () => {
		await registerUser({
			email: "bcrypt@example.com",
			username: "bcryptuser",
			displayName: "Bcrypt User",
			password: "password123",
		});

		const user = await db.select().from(users).where(eq(users.email, "bcrypt@example.com")).get();

		expect(user?.passwordHash.startsWith("$2")).toBe(true);
	});

	it("migrates legacy seeded users on login without plaintext passwords", async () => {
		const userId = "legacy-user-id";
		await db.insert(users).values({
			id: userId,
			email: "legacy@example.com",
			username: "legacyuser",
			displayName: "Legacy User",
			passwordHash: legacyHashPasswordForTests("password123"),
			role: "user",
		});

		await loginUser({ email: "legacy@example.com", password: "password123" });

		const updated = await db.select().from(users).where(eq(users.id, userId)).get();
		expect(updated?.passwordHash.startsWith("$2")).toBe(true);
	});

	it("rejects forged admin JWT when role is not in database", async () => {
		const userId = "regular-user-id";
		await db.insert(users).values({
			id: userId,
			email: "regular@example.com",
			username: "regularuser",
			displayName: "Regular User",
			passwordHash: await hashPassword("password123"),
			role: "user",
		});

		const forgedToken = jwt.sign(
			{ userId, username: "regularuser", role: "admin" },
			process.env.GRPC_JWT_SECRET || "chirp-grpc-jwt-secret-key-at-least-32-chars",
			{ expiresIn: 3600 },
		);

		const auth = await resolveAuthContext(forgedToken);
		expect(auth.role).toBe("user");
	});
});

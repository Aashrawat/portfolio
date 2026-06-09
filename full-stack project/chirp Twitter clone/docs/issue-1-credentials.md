# Issue 1: Credentials & Trust

## Password storage (Critical)

**Vulnerability:** SHA-256 with a static `"salt"` in `utils.ts`. Fast to brute-force; identical passwords produce identical hashes.

**Fix:** bcrypt (cost 12) for new passwords. `verifyPassword()` accepts legacy `sha256:` prefixed hashes and raw 64-char hex from existing seed data, then rehashes to bcrypt on successful login.

**Migration:** Incremental — no mass reset. Seeded users log in once; hash upgrades automatically.

## Client/API trust (Critical)

**Vulnerability:** Clients re-signed JWTs with a shared hardcoded secret and could set `role: "admin"`. API trusted JWT role claims without DB lookup.

**Fix:**
- Clients store and forward the API-issued `sessionToken` (no client-side JWT signing).
- `resolveAuthContext()` loads role from the database.
- `requireAdmin()` verifies role from DB, not JWT claims.

## Tests

See `apps/api/src/services/security.test.ts`.

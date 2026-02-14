# Research: Seed Dev Test Users

**Feature**: 004-seed-dev-users  
**Date**: 2025-02-15

## 1. Password hashing in seed script

**Decision**: Use bcrypt in the seed script with salt rounds 10, matching the application's `BcryptPasswordHasher`.

**Rationale**: The app hashes passwords with bcrypt (salt rounds 10) for registration and login. Seed users must store the same format so developers can sign in via the existing auth flow. Hashing in the seed script keeps the seed self-contained and avoids importing application DI or use cases.

**Alternatives considered**:
- **Import BcryptPasswordHasher from src**: Would couple the seed to application infrastructure and DI; rejected.
- **Pre-computed hash checked into repo**: Works but requires regenerating hashes when the shared password changes; same bcrypt cost (10) in seed is simpler and keeps one source of truth for the password value (documented plaintext in SEEDING-GUIDE).

**Implementation**: In seed-utils (or a small helper used only during seed), call `bcrypt.hash(sharedPassword, 10)` once per seed run and use the result for all 3 users. The shared password value is defined in one place (e.g. constant or env) and documented in SEEDING-GUIDE; the hash is never committed.

---

## 2. Deterministic seed user identity

**Decision**: Define seed dev users in `seed-data.ts` with deterministic UUIDs (existing `deterministicUuid(seed)`) and deterministic emails (e.g. `dev-user-1@seed.local`, `dev-user-2@seed.local`, `dev-user-3@seed.local` or tenant-scoped names).

**Rationale**: Spec requires deterministic identities so the same users are created on every run when they do not exist. Existing seed pattern uses `deterministicUuid` for all entities; emails must be unique and stable for skip-by-email and for documentation.

**Alternatives considered**:
- **Random UUIDs**: Would break determinism and make documentation of user IDs harder; rejected.
- **Emails only, no fixed UUIDs**: Prisma `@id @default(uuid())` would generate new IDs on create; we need fixed IDs for deterministic references and for idempotency checks; use deterministic UUIDs for seed dev users.

**Implementation**: Add `SEED_DEV_USERS` in seed-data.ts: array of `{ id, email, nickname, tenantId, isTenantAdmin }` with `id: deterministicUuid(...)`, `email` unique and stable (e.g. `dev-tenant1-admin@seed.local`, `dev-tenant1-user@seed.local`, `dev-tenant2-admin@seed.local`).

---

## 3. Skip-if-exists by email

**Decision**: Before creating each seed dev user, check for an existing user with the same email (in the same tenant or globally, since email is unique). If found, skip (do not create, do not update).

**Rationale**: Spec FR-004 and clarifications require skip-if-exists; no upsert. Email is the natural identity for “same dev user” and is unique in the schema.

**Alternatives considered**:
- **Upsert by email**: Spec explicitly chose skip; rejected.
- **Check by deterministic UUID**: Would work but email is the documented identifier for developers; skip-by-email aligns with how credentials are documented (email + password).

**Implementation**: For each entry in `SEED_DEV_USERS`, `prisma.user.findUnique({ where: { email } })`. If not null, skip. If null, create with `prisma.user.create` (id, email, nickname, passwordHash, isTenantAdmin, tenantId).

---

## 4. Where to document the shared password

**Decision**: Document the shared password and the 3 seed user emails (and nicknames) in the existing **SEEDING-GUIDE** (docs/SEEDING-GUIDE.md). Optionally add a short pointer in docs/quickstart.md to “Seed dev users” in SEEDING-GUIDE.

**Rationale**: Spec clarification: credentials in the existing seeding guide (SEEDING-GUIDE or quickstart). SEEDING-GUIDE is the main place for seed implementation and usage; quickstart can link to it.

**Implementation**: Add a section “Seed dev users” in SEEDING-GUIDE with a table: email, nickname, tenant, role (admin/regular), and a single shared password (e.g. “Use password: `DevPassword1!` for all three users”). Do not commit the password in code comments; keep it only in docs or in a single constant used at seed time and documented.

---

## 5. Ordering: dev users vs system users and meals

**Decision**: Create seed dev users **after** tenants and **before** or **after** system users; if meals reference `createdBy`, keep using system users for meal creation so dev users are purely for login/testing. Create dev users in the same tenant loop or in a dedicated pass after tenants exist.

**Rationale**: Existing seed creates system users per tenant for `meal.createdBy`. Dev users are separate: they do not need to own meals; they are for auth and tenant-scoped testing. Creating dev users after tenants (and optionally after system users) keeps ordering simple and avoids coupling meal creation to dev users.

**Implementation**: In `seedDatabase`, after tenants are created (and optionally after system users), run a pass over `SEED_DEV_USERS`: for each, skip if user exists by email, else create with hashed password. No change to meal `createdBy` (continue using system user IDs).

# Tasks: Seed Dev Test Users

**Input**: Design documents from `/specs/004-seed-dev-users/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently. User Story 1 delivers the 3 dev users and sign-in capability; User Story 2 verifies idempotency (same implementation: skip-by-email).

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files or no dependencies)
- **[Story]**: User story (US1, US2) for story-phase tasks only
- Include exact file paths in descriptions

## Path Conventions

- **Seed**: `prisma/seed.ts`, `prisma/seed-data.ts`, `prisma/seed-utils.ts`
- **Docs**: `docs/SEEDING-GUIDE.md`, `docs/quickstart.md`
- **Tests**: `tests/integration/seeding.integration.spec.ts`, `tests/e2e/seeding.e2e.spec.ts`

---

## Phase 1: Setup (Shared Prerequisites)

**Purpose**: Confirm dependencies and seed entry point are ready for dev user seeding.

- [ ] T001 [P] Confirm bcrypt and Prisma are available for seed (package.json has bcrypt; prisma/seed.ts runs seedDatabase) so dev user password hashing can use bcrypt in prisma/seed-utils.ts

---

## Phase 2: Foundational (Blocking for User Stories)

**Purpose**: Define seed dev user data and shared password so creation and tests can use them.

**Checkpoint**: SEED_DEV_USERS and shared password constant exist; user story implementation can begin.

- [ ] T002 [P] Add SEED_DEV_USERS array to prisma/seed-data.ts with 3 entries: deterministic id (deterministicUuid), email, nickname, tenantId, isTenantAdmin; 2 users for Tenant-1 (one admin, one regular), 1 user for Tenant-2 (admin); use SEED_TENANTS for tenantId
- [ ] T003 Add shared password constant for dev users (e.g. in prisma/seed-data.ts or prisma/seed-utils.ts) used only at seed time; same value to be documented in docs/SEEDING-GUIDE.md

---

## Phase 3: User Story 1 - Predictable test users (Priority: P1) — MVP

**Goal**: After running the seed once, exactly 3 dev users exist (2 for Tenant-1, 1 for Tenant-2) with distinct emails and nicknames; one admin per tenant; all share one password; developers can sign in with documented credentials.

**Independent Test**: Run `bun run db:seed` once, then verify 3 users exist with expected tenant assignment and sign in via auth API with one of the documented emails and shared password.

### Implementation for User Story 1

- [ ] T004 [US1] In prisma/seed-utils.ts after tenants exist: hash shared password once with bcrypt (salt rounds 10); for each SEED_DEV_USER call prisma.user.findUnique({ where: { email } }); if null, prisma.user.create with id, email, nickname, passwordHash, isTenantAdmin, tenantId; run dev user creation after tenants and after system users (so meals still use system user as createdBy)
- [ ] T005 [US1] Add usersCreated to SeedResult in prisma/seed-utils.ts (increment when each dev user is created) and log usersCreated in prisma/seed.ts completion output
- [ ] T006 [P] [US1] Add integration tests in tests/integration/seeding.integration.spec.ts: after seed, assert exactly 3 dev users by known emails, 2 for Tenant-1 and 1 for Tenant-2, and exactly one isTenantAdmin per tenant
- [ ] T007 [P] [US1] Extend E2E in tests/e2e/seeding.e2e.spec.ts: after seed, assert 3 users total and correct tenant assignment (2 users for first tenant, 1 for second)

**Checkpoint**: User Story 1 complete; 3 dev users created on first run, sign-in possible with documented credentials.

---

## Phase 4: User Story 2 - Seed remains idempotent (Priority: P2)

**Goal**: Re-running the seed does not create duplicate users; when a seed user already exists (by email), seed skips (no create, no update).

**Independent Test**: Run `bun run db:seed` twice; verify total dev user count remains 3 and Tenant-1 has 2 users, Tenant-2 has 1 user.

### Implementation for User Story 2

Implementation is shared with US1 (skip-by-email in T004). This phase adds tests that verify idempotency.

- [ ] T008 [P] [US2] Add integration test in tests/integration/seeding.integration.spec.ts: run seed twice (or seed then seed again), assert still exactly 3 dev users and no duplicate emails for seed dev user addresses
- [ ] T009 [P] [US2] Add integration test in tests/integration/seeding.integration.spec.ts: when a user with the same email as a SEED_DEV_USER already exists, seed run does not create a duplicate and does not update that user (skip-if-exists by email)

**Checkpoint**: User Story 2 verified; idempotency and skip-if-exists covered by tests.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Document credentials and update high-level docs so developers can find and use seed dev users.

- [ ] T010 [P] Add "Seed dev users" section to docs/SEEDING-GUIDE.md with table: email, nickname, tenant, role (admin/regular), and shared password; state that all 3 users share one password
- [ ] T011 [P] Add short pointer to Seed dev users (or SEEDING-GUIDE#seed-dev-users) in docs/quickstart.md so developers can find credentials quickly
- [ ] T012 Update README.md seeding paragraph to mention 3 dev users (e.g. "The seed creates 2 tenants, 3 dev users, 10 meals and 15 ingredients per tenant…") if it currently lists what the seed creates

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — can start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — defines SEED_DEV_USERS and shared password; blocks US1/US2 implementation.
- **Phase 3 (US1)**: Depends on Phase 2 — implements creation and first-run tests.
- **Phase 4 (US2)**: Depends on Phase 3 — adds idempotency/skip-if-exists tests (creation logic already in T004).
- **Phase 5 (Polish)**: Depends on Phase 3 (docs can be written once US1 is done); can overlap with Phase 4.

### User Story Dependencies

- **User Story 1 (P1)**: After Phase 2; no dependency on US2. Delivers 3 dev users and skip-by-email behavior.
- **User Story 2 (P2)**: Same implementation as US1 (skip-by-email); Phase 4 adds tests only.

### Within Each User Story

- T004 (create dev users) before T005 (result count and logging).
- T006, T007 can be written after T004–T005 or in parallel (different test files).
- T008, T009 can run in parallel (both integration tests).

### Parallel Opportunities

- **Phase 1**: T001 can run alone.
- **Phase 2**: T002 and T003 can run in parallel (T002 data only; T003 constant).
- **Phase 3**: T006 and T007 are [P] (different test files).
- **Phase 4**: T008 and T009 are [P].
- **Phase 5**: T010, T011, T012 are [P] (different docs/files).

---

## Parallel Example: User Story 1

```text
# After T004–T005 are done, run tests in parallel:
T006: "Add integration tests in tests/integration/seeding.integration.spec.ts..."
T007: "Extend E2E in tests/e2e/seeding.e2e.spec.ts..."
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 (Setup).
2. Complete Phase 2 (Foundational): SEED_DEV_USERS + shared password.
3. Complete Phase 3 (US1): T004, T005, then T006, T007.
4. **Stop and validate**: Run `bun run db:seed`, then sign in with one dev user email and shared password.
5. Optionally add Phase 5 (T010–T012) so credentials are documented.

### Incremental Delivery

1. Phase 1 + 2 → Foundation ready.
2. Phase 3 (US1) → 3 dev users and tests → MVP.
3. Phase 4 (US2) → Idempotency tests.
4. Phase 5 → Docs and README.

### Test-First Option

- Write T006, T007 (US1 tests) after T002–T003, run and see them fail; then implement T004–T005.
- Write T008, T009 (US2 tests) after T004, run and see them pass (idempotency already implemented).

---

## Notes

- [P] tasks use different files or have no ordering dependency.
- [US1]/[US2] map tasks to user stories for traceability.
- Skip-by-email is implemented once in T004; US2 is verified by tests (T008, T009).
- Validate with `bun run check` after implementation.
- Commit after each task or logical group.

# Implementation Tasks: Development Database Seed File

**Feature**: `002-dev-db-seed`  
**Branch**: `002-dev-db-seed`  
**Date**: February 13, 2026  
**Spec**: [spec.md](./spec.md) | **Plan**: [plan.md](./plan.md)

---

## Executive Summary

This document breaks down the seed file implementation into concrete, actionable tasks organized by user story and completion phase. All tasks follow the strict checklist format and include file paths, acceptance criteria, and dependencies.

**Total Tasks**: 46  
**Phases**: 7 (Setup, Foundational, US1, US2, US3, US4, Polish)  
**Critical Path**: Setup → Foundational → US1 (seeds everything) → US2-4 (can parallel after US1)  
**Estimated Effort**: ~2-3 weeks (60-80 hours)

---

## Phase 1: Setup & Infrastructure

**Objective**: Initialize project structure, configure build tooling, set up testing framework.

**Phase Goal**: Developers can build and run tests; seed code compiles and dependencies resolved.

**Independent Test**: `npm test -- seeding` runs without missing dependencies or configuration errors.

### Setup Tasks

- [X] T001 Create project structure in `prisma/` directory with subdirectories for seeds, utilities, tests
- [X] T002 [P] Update `package.json` with npm scripts: `db:seed`, `db:reset`, `db:studio`
- [X] T003 [P] Add TypeScript compilation target for seed scripts (tsconfig configuration)
- [X] T004 Install dependencies: `uuid` package for deterministic UUID generation
- [X] T005 [P] Create `.env.example` with `DATABASE_URL` and `SEED_VERBOSE` variables
- [X] T006 [P] Set up Jest configuration for integration and E2E test execution
- [X] T007 Create initial seed test files (empty, to be populated in Phase 2-3)

---

## Phase 2: Foundational Implementation (Blocking Prerequisites)

**Objective**: Implement core utilities and helper functions that enable all user stories.

**Phase Goal**: Seed utilities are tested and ready; developers can use helpers for building seed data.

**Independent Test**: Integration tests pass for all utility functions (UUID generation, logging, idempotency checks).

### Utility Functions

- [X] T008 [P] Implement deterministic UUID generation helper in `prisma/seed-utils.ts`
  - File: `prisma/seed-utils.ts`
  - Acceptance: `deterministicUuid('test')` returns consistent v5 UUID; tested with same input twice
- [X] T009 [P] Implement logging helpers (log, logVerbose, logError) in `prisma/seed-utils.ts`
  - File: `prisma/seed-utils.ts`
  - Acceptance: Logs include timestamps, prefixes (✓/✗), optional [VERBOSE] markers; SEED_VERBOSE env var controls verbose output
- [X] T010 Implement idempotency check function in `prisma/seed-utils.ts`
  - File: `prisma/seed-utils.ts`
  - Acceptance: `checkIdempotency(prisma, tenantId)` queries for marker meal and returns boolean
- [X] T011 [P] Implement error handling wrapper function (try-catch, exit codes) in `prisma/seed-utils.ts`
  - File: `prisma/seed-utils.ts`
  - Acceptance: Errors logged, process exits with code 1; successful runs exit with 0
- [X] T012 Create integration tests for all seed utilities in `tests/integration/seeding.integration.spec.ts`
  - File: `tests/integration/seeding.integration.spec.ts`
  - Acceptance: 100% test coverage for all utility functions; deterministic UUID consistency verified

### Seed Data Definitions

- [X] T013 Define tenant seed data in `prisma/seed-data.ts`
  - File: `prisma/seed-data.ts`
  - Acceptance: 2 tenants with deterministic UUIDs; names and IDs hardcoded
- [X] T014 [P] Define ingredient seed data in `prisma/seed-data.ts` (15 vegan ingredients, distributed across storage types)
  - File: `prisma/seed-data.ts`
  - Acceptance: 15 ingredients; 4 FRIDGE, 6 PANTRY, 3 FROZEN, 2 OTHER; all vegan; duplicated per tenant
- [X] T015 [P] Define meal seed data in `prisma/seed-data.ts` (10 vegan meals with diverse qualities)
  - File: `prisma/seed-data.ts`
  - Acceptance: 10 meals per tenant; each with mealName, qualities (8 boolean flags), and 3-6 ingredients; all vegan recipes
- [X] T016 [P] Define meal quality seed data embedded in meal definitions
  - File: `prisma/seed-data.ts` (part of meal definitions)
  - Acceptance: 9 qualities covered across 10 meals (at least 2 meals per quality); qualities match meal characteristics
- [X] T017 Define user settings seed data in `prisma/seed-data.ts` (per-tenant weekStartDay and daily preferences)
  - File: `prisma/seed-data.ts`
  - Acceptance: 2 tenants with distinct weekStartDay (T1: MONDAY, T2: SUNDAY); 7-day preferences per tenant; realistic constraints
- [X] T018 [P] Define planned week and day plan seed data in `prisma/seed-data.ts`
  - File: `prisma/seed-data.ts`
  - Acceptance: 2 weeks per tenant; 7 day plans each; week start dates respect tenant's weekStartDay; ~50% meal coverage (7 meals per week)

---

## Phase 3: User Story 1 (P1) - Initialize Dev Environment with Sample Data

**Story Goal**: Developers clone repo, run `npm run db:seed`, and immediately have realistic test data without manual creation.

**Independent Test**: Running seed on clean database populates 10+ meals, 15+ ingredients, and user settings; developer can query API endpoints and retrieve seeded data.

**Acceptance Criteria**:
- At least 10 distinct meals seeded with varying qualities
- At least 15 unique ingredients with distributed storage types
- User settings for each tenant with valid weekStartDay and daily preferences
- All seeded records have valid timestamps
- Seed completes in <2 minutes
- API endpoints return seeded data correctly

### Implementation Tasks

- [X] T019 [US1] Implement main seed orchestration function in `prisma/seeds.ts`
  - File: `prisma/seed.ts` (entry point; orchestration in `prisma/seed-utils.ts`)
  - Acceptance: Function initializes Prisma client, calls sub-functions for tenants/ingredients/meals/settings, logs progress, handles errors with exit codes
- [X] T020 [US1] Implement tenant and user settings seed logic
  - File: `prisma/seed-utils.ts` (seedDatabase)
  - Acceptance: Creates 2 tenants with settings; each tenant has 7-day quality preferences; timestamps valid (ISO 8601)
- [X] T021 [P] [US1] Implement ingredient seed logic
  - File: `prisma/seed-utils.ts` (seedDatabase)
  - Acceptance: Creates 15 vegan ingredients per tenant; distributed across storage types; no duplicates per tenant
- [X] T022 [P] [US1] Implement meal seed logic with quality flags
  - File: `prisma/seed-utils.ts` (seedDatabase)
  - Acceptance: Creates 10 vegan meals per tenant; each with correct quality flags; 9 qualities covered; at least 5 meals have 5+ ingredients
- [X] T023 [P] [US1] Implement meal-ingredient relationship seeding
  - File: `prisma/seed-utils.ts` (seedDatabase)
  - Acceptance: Links ingredients to meals; at least 5 meals have 5+ ingredients; FR-006 satisfied; no broken foreign keys
- [X] T024 [US1] Implement idempotency check and skip logic
  - File: `prisma/seed-utils.ts` (seedDatabase)
  - Acceptance: Before seeding, checks for marker meal; if found, logs skip message and exits with 0; if not found, proceeds with seeding
- [X] T025 [US1] Create E2E test to verify seed output for US1
  - File: `tests/e2e/seeding.e2e.spec.ts`
  - Acceptance: Test runs seed, verifies meal count >=10, ingredient count >=15, user settings created; execution time <2 minutes; assertions pass

---

## Phase 4: User Story 2 (P2) - Seed Multiple Test Tenants

**Story Goal**: Developers test multi-tenant isolation with separate meal libraries and settings per tenant.

**Independent Test**: Query database filtered by tenantId; verify Tenant-A sees only Tenant-A meals/settings; Tenant-B sees only Tenant-B data.

**Acceptance Criteria**:
- 2+ separate tenants with isolated meal libraries
- Meals properly scoped to tenantId
- Settings properly scoped to tenantId
- Query filtering by tenantId returns only tenant-owned data
- No cross-tenant data leakage

### Implementation Tasks

- [X] T026 [P] [US2] Implement tenant-scoped meal creation logic
  - File: `prisma/seed-utils.ts` (seedDatabase)
  - Acceptance: Each meal in seedMeals() receives tenantId parameter; created meals have correct tenantId; no shared meals across tenants
- [X] T027 [P] [US2] Implement tenant-scoped ingredient creation logic
  - File: `prisma/seed-utils.ts` (seedDatabase)
  - Acceptance: Each ingredient receives tenantId; all 15 ingredients created per tenant (30 total); no shared ingredients
- [X] T028 [US2] Create integration test to verify multi-tenant isolation
  - File: `tests/integration/seeding.integration.spec.ts`
  - Acceptance: Query Tenant-1 meals, verify all have tenantId=T1; query Tenant-2 meals, verify all have tenantId=T2; no overlap

---

## Phase 5: User Story 3 (P2) - Seed Meals with Complex Quality Combinations

**Story Goal**: Developers test quality-based meal filtering with diverse meal qualities.

**Independent Test**: Call eligible meals endpoint with various date/meal type parameters; verify results match quality preferences for that day.

**Acceptance Criteria**:
- Seeded meals cover all 9 meal qualities
- At least 2 meals per quality combination
- Meals marked as lunch-suitable can be assigned to lunch slots
- Meals marked as dinner-suitable can be assigned to dinner slots
- Quality filtering returns correct meals based on preferences

### Implementation Tasks

- [X] T029 [US3] Verify meal quality diversity in seed data
  - File: `tests/integration/seeding.integration.spec.ts` or separate script
  - Acceptance: Audit seeded meals (10 per tenant); verify 9 qualities covered; at least 2 meals per quality; lunch/dinner flags consistent with assignments
- [X] T030 [P] [US3] Create integration test for quality-based filtering with seeded data
  - File: `tests/integration/seeding.integration.spec.ts`
  - Acceptance: Test queries eligible meals for Monday lunch (creamy preference); verifies only creamy meals marked isLunch are returned; tests 3+ day/preference combinations
- [X] T031 [US3] Create E2E test for eligible meals endpoint with seeded data
  - File: `tests/e2e/seeding.e2e.spec.ts`
  - Acceptance: E2E test calls `/meals/eligible?date=...&mealType=lunch` with authentication; verifies results match seeded quality preferences; tests both hit and miss cases

---

## Phase 6: User Story 4 (P3) - Seed Planned Week Structure for Testing

**Story Goal**: Developers test planned week assignment logic with partial meal assignments.

**Independent Test**: Retrieve seeded planned weeks; verify structure (7 day plans, correct dates, ~50% meal coverage); test meal assignment updates on empty slots.

**Acceptance Criteria**:
- 2 planned weeks seeded per tenant
- Week 1 starts from "next Monday"
- Week 2 starts 7 days after Week 1
- Each week has exactly 7 day plans
- Day plans have correct dates matching weekStartDay preference
- ~50% meal coverage (7 meals across 14 day-slots)
- Empty slots available for testing assignment logic
- Dinner assignments enable leftover testing

### Implementation Tasks

- [X] T032 [US4] Implement planned week seed logic (dates respect weekStartDay)
  - File: `prisma/seeds.ts` (or helper function)
  - Acceptance: Creates 2 weeks per tenant; Week 1 starts next Monday; Week 2 starts +7 days; startingDate respects tenant's weekStartDay setting
- [X] T033 [P] [US4] Implement day plan seed logic with partial meal assignments
  - File: `prisma/seeds.ts` (or helper function)
  - Acceptance: Creates 7 day plans per week (14 total per tenant); ~50% coverage (7 meals across 14 slots); includes both lunch and dinner assignments; includes empty slots; dates are sequential
- [X] T034 [US4] Create E2E test for planned week structure
  - File: `tests/e2e/seeding.e2e.spec.ts`
  - Acceptance: Test retrieves seeded weeks, verifies 7 day plans each, verifies dates align with weekStartDay, verifies some slots filled and some empty
- [X] T035 [P] [US4] Create integration test for day plan meal assignments
  - File: `tests/integration/seeding.integration.spec.ts`
  - Acceptance: Test verifies meal assignments respect meal qualities (isDinner meals in dinner slots, isLunch in lunch slots); tests leftover potential (dinners that makesLunch assigned)

---

## Phase 7: Testing & Documentation (Polish)

**Objective**: Complete test coverage, validate all requirements met, ensure comprehensive documentation.

**Phase Goal**: All tests pass; seed meets all success criteria (including determinism verification per FR-008); documentation enables independent developer usage.

### Testing & Validation

- [X] T036 [P] Create comprehensive E2E test suite for all user stories
  - File: `tests/e2e/seeding.e2e.spec.ts`
  - Acceptance: Tests cover all 4 user stories; each test is independent; all assertions pass; seed completes in <2 minutes
- [ ] T037 Run full test suite and achieve 100% pass rate
  - Command: `npm test -- seeding`
  - Acceptance: All unit tests pass, all integration tests pass, all E2E tests pass; no flaky tests
- [X] T038 Measure and verify seed execution time <2 minutes
  - File: `tests/e2e/seeding.e2e.spec.ts` (add timing assertions)
  - Acceptance: Time measurement on clean database; confirms <2 min (SC-001)
- [X] T039 Verify 80% unique meal-ingredient combinations (SC-002)
  - File: Validation script or test in `tests/integration/seeding.integration.spec.ts`
  - Acceptance: Audit all seeded meals (10 per tenant = 20 total); calculate unique name-ingredient combinations; verify >=80% (≥16 of 20 meals) have unique combinations; document calculation in test output

### Documentation Updates

- [ ] T040 Verify quickstart.md is accurate and complete
  - File: `quickstart.md` (already created in plan phase)
  - Acceptance: All steps tested and work end-to-end; commands match project setup; troubleshooting section covers common issues
- [ ] T041 Verify SEEDING-GUIDE.md implementation details match actual code
  - File: `SEEDING-GUIDE.md` (already created in plan phase)
  - Acceptance: File structure matches created code; examples are correct; troubleshooting covers actual error patterns
- [X] T042 Create README section linking to seeding documentation
  - File: `README.md` (project root)
  - Acceptance: Main README has section "Database Seeding" with links to quickstart.md and SEEDING-GUIDE.md; "Getting Started" mentions seed as part of setup
- [X] T043 Add JSDoc comments to seed functions for IDE support
  - Files: `prisma/seeds.ts`, `prisma/seed-utils.ts`, `prisma/seed-data.ts`
  - Acceptance: All exported functions have JSDoc; parameters and return types documented; usage examples in comments

### Final Verification

- [X] T047 Verify seed determinism (FR-008) via multiple runs
  - File: Test script or integration test in `tests/integration/seeding.integration.spec.ts`
  - Acceptance: Run seed twice on fresh databases with same inputs; compare database snapshots (meal names, ingredient IDs, user settings); verify 100% match (bit-for-bit identical output); document variance (if any) and root cause
- [ ] T044 Run complete workflow: migrate → seed → test → verify
  - Commands: `npm run db:migrate && npm run db:seed && npm test && npm run db:studio`
  - Acceptance: All steps succeed; data visible in Prisma Studio; no errors
- [ ] T045 Verify all acceptance criteria met for each user story + determinism
  - Cross-reference: Spec.md acceptance scenarios vs. implementation; verify FR-008 determinism (from T047)
  - Acceptance: Checklist completed; all scenarios testable and tested; determinism validation passed (T047)
- [ ] T046 Code review of all seed files for quality standards compliance
  - Files: `prisma/seeds.ts`, `prisma/seed-data.ts`, `prisma/seed-utils.ts`
  - Acceptance: Code passes clean code standards (SOLID, DRY, readability); modular; testable; follows constitution

---

## Dependencies & Execution Order

### Critical Path

```
T001-T007 (Setup)
    ↓
T008-T012 (Utilities)
    ↓
T013-T018 (Seed Data)
    ↓
T019-T025 (US1 Implementation) ← Can't start until T008-T018 complete
    ↓
T026-T028 (US2) ← Can parallel with T029-T035 (US3-4)
T029-T031 (US3)
T032-T035 (US4)
    ↓
T036-T046 (Testing & Polish)
```

### Parallelizable Tasks

**After Setup (T001-T007)**:
- T008-T012 (Utils) and T013-T018 (Seed Data) can be done in parallel

**After Utilities (T008-T018)**:
- T026-T028 (US2), T029-T031 (US3), T032-T035 (US4) can be parallelized once US1 is complete

**Testing Phase (T036-T047)**:
- T040-T042 (Docs) can start after T035
- T036-T039, T047 (Tests) block T044-T046

---

## Task Tracking Checklist

Use this section to track progress:

### Phase 1: Setup
- [ ] T001-T007 Complete

### Phase 2: Foundational
- [ ] T008-T018 Complete

### Phase 3: US1
- [X] T019-T025 Complete

### Phase 4: US2
- [X] T026-T028 Complete

### Phase 5: US3
- [ ] T029-T031 Complete

### Phase 6: US4
- [ ] T032-T035 Complete

### Phase 7: Testing & Polish
- [ ] T036-T046 Complete

---

## Acceptance Criteria Summary by User Story

### User Story 1 (P1): Initialize Dev Environment
**Completed when**:
- 10+ meals created with diverse qualities
- 15+ ingredients created with distributed storage
- User settings created for 2+ tenants
- Seed runs in <2 minutes on clean database
- API endpoints return seeded data
- T019-T025 tasks completed and E2E tests pass

### User Story 2 (P2): Multi-Tenant Isolation
**Completed when**:
- Meals properly scoped to tenantId (no sharing)
- Settings properly scoped to tenantId
- Query filtering by tenantId works correctly
- T026-T028 tasks completed and tests pass

### User Story 3 (P2): Quality Combinations
**Completed when**:
- All 9 qualities covered in seeded meals
- At least 2 meals per quality
- Lunch/dinner flags consistent with meal purposes
- Quality filtering works via API
- T029-T031 tasks completed and tests pass

### User Story 4 (P3): Planned Week Structure
**Completed when**:
- 2 weeks seeded per tenant
- Week dates respect weekStartDay
- 7 day plans per week with correct dates
- ~50% meal coverage (7 meals per week)
- Empty slots available for testing
- T032-T035 tasks completed and tests pass

---

## Files Created/Modified

| File | Type | Purpose |
|------|------|---------|
| `prisma/seeds.ts` | NEW | Main seed entry point |
| `prisma/seed-data.ts` | NEW | Hardcoded seed data (meals, ingredients, settings, weeks) |
| `prisma/seed-utils.ts` | NEW | Helper functions (UUID, logging, idempotency, error handling) |
| `tests/integration/seeding.integration.spec.ts` | NEW | Unit tests for seed utilities |
| `tests/e2e/seeding.e2e.spec.ts` | NEW | E2E tests for full seed execution |
| `package.json` | MODIFY | Add `db:seed`, `db:reset` scripts |
| `README.md` | MODIFY | Add "Database Seeding" section with links |
| `tsconfig.json` | MODIFY | Configure TS for seed script compilation (if needed) |

---

## Implementation Strategy

### MVP Scope (Phase 3 - US1 Only)
Minimum viable product delivers core seed functionality:
- Database populated with 10+ meals, 15+ ingredients
- User settings with preferences
- Idempotent execution (no duplicates)
- <2 minute seed execution
- E2E test verifying output

**Effort**: ~1 week  
**Delivers**: Developers can seed and test basic API functionality

### Incremental Delivery
1. **Week 1**: Setup + Foundational (T001-T018) + US1 (T019-T025)
2. **Week 2**: US2-US4 (T026-T035) + Testing (T036-T039)
3. **Week 3**: Documentation (T040-T043) + Polish (T044-T046)

Each phase is testable and deployable independently.

---

## Success Metrics (Post-Implementation)

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Seed Execution Time | <2 minutes | `time npm run db:seed` |
| Meal Diversity | ≥80% unique combos | Audit ingredient linkage |
| Quality Coverage | All 9 qualities | Count per-quality meal distribution |
| Tenant Isolation | 100% | Query filtering tests pass |
| Test Coverage | ≥90% | Jest coverage report |
| Documentation | Complete | All quickstart steps work end-to-end |
| Code Quality | Pass review | Constitution compliance verified |

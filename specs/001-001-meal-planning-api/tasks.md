# Tasks: Vegan Meal Planning API

**Input**: Design documents in `/specs/001-001-meal-planning-api/` (plan.md, spec.md, data-model.md, contracts/openapi.yaml, research.md)

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 Scaffold Clean Architecture directories in `src/` and `tests/` per `plan.md`
- [ ] T002 Initialize Bun+TypeScript project config in `package.json` and `tsconfig.json` (strict, ESNext, bundler)
- [ ] T003 [P] Configure lint/format tooling in `.eslintrc.json`, `.prettierrc`, and add scripts in `package.json`
- [ ] T004 [P] Add PostgreSQL docker compose and environment template in `docker-compose.yml` and `.env.example`
- [ ] T005 [P] Add Bun scripts for dev/build/test/lint/type-check in `package.json`

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T006 Define Prisma schema from `data-model.md` in `prisma/schema.prisma`
- [ ] T007 Create initial migration and generate Prisma client in `prisma/migrations/`
- [ ] T008 [P] Add Prisma client wrapper and database config in `src/infrastructure/database/prisma/client.ts` and `src/infrastructure/config/database.config.ts`
- [ ] T009 [P] Add shared enums and value objects (DayOfWeek, ShortDay, WeekStartDay, StorageType) in `src/domain/shared/`
- [ ] T010 [P] Add `Result` helper for domain/application errors in `src/domain/shared/result.ts`
- [ ] T011 Implement DI container skeleton and interfaces in `src/infrastructure/di/container.ts`
- [ ] T012 Setup HTTP server bootstrap and route registry in `src/index.ts` and `src/infrastructure/http/routes/index.ts`
- [ ] T013 Add auth and tenant isolation middleware placeholders in `src/infrastructure/http/middleware/auth.middleware.ts` and `tenant-isolation.middleware.ts`
- [ ] T014 Add global error and validation middleware in `src/infrastructure/http/middleware/error-handler.middleware.ts` and `validation.middleware.ts`
- [ ] T015 Add common DTO primitives (error/pagination) in `src/infrastructure/http/dtos/common.dto.ts`
- [ ] T016 Add test harness setup (Bun test config, database test utils) in `tests/setup.ts`

## Phase 3: User Story 1 - Create and Manage Weekly Meal Plans (Priority: P1) 🎯 MVP

**Goal**: Users can create 7-day planned weeks, assign lunch/dinner meals, view eligible meals, and auto-populate leftovers.

**Independent Test**: Create a planned week aligned to weekStartDay, assign meals to days, verify leftovers populate next-day lunch when `makesLunch=true`, and retrieve eligible meals per day/meal-type.

### Tests (write first)
- [ ] T017 [P] [US1] Write e2e contract tests for planned week endpoints in `tests/e2e/planned-week.e2e.spec.ts`
- [ ] T018 [P] [US1] Write unit tests for PlannedWeek/DayPlan aggregates and leftover rules in `tests/unit/domain/planned-week/planned-week.spec.ts`
- [ ] T019 [P] [US1] Write unit tests for planned-week use cases (create, assign, get, delete) in `tests/unit/application/planned-week/create-planned-week.usecase.spec.ts`
- [ ] T020 [P] [US1] Write e2e tests for eligible meals endpoint in `tests/e2e/meal-eligible.e2e.spec.ts`

### Implementation
- [ ] T021 [P] [US1] Implement PlannedWeek aggregate and DayPlan entity with leftover logic in `src/domain/planned-week/`
- [ ] T022 [P] [US1] Implement planned-week repository interface in `src/domain/planned-week/planned-week.repository.ts`
- [ ] T023 [P] [US1] Implement planned-week use cases (create week, assign meal, get week, delete week, populate leftovers) in `src/application/planned-week/`
- [ ] T024 [P] [US1] Implement eligible meals filtering use case (FR-007) in `src/application/meal/get-eligible-meals.usecase.ts`
- [ ] T025 [P] [US1] Add Prisma planned-week repository in `src/infrastructure/database/repositories/prisma-planned-week.repository.ts`
- [ ] T026 [P] [US1] Add DTOs and validators for planned weeks/day plans in `src/infrastructure/http/dtos/planned-week.dto.ts`
- [ ] T027 [US1] Implement planned-week HTTP controller and routes in `src/infrastructure/http/controllers/planned-week.controller.ts` and `routes/index.ts`
- [ ] T028 [US1] Implement day-plan PATCH controller for meal assignments in `src/infrastructure/http/controllers/day-plan.controller.ts`
- [ ] T029 [US1] Expose eligible meals endpoint handler in `src/infrastructure/http/controllers/meal.controller.ts` (eligible action only)
- [ ] T030 [US1] Wire DI container bindings for planned-week and eligible-meal services in `src/infrastructure/di/container.ts`
- [ ] T031 [US1] Add integration tests for planned-week repository in `tests/integration/repositories/planned-week.repository.spec.ts`

## Phase 4: User Story 2 - Build and Maintain Personal Meal Library (Priority: P2)

**Goal**: Users can create, update, list, and archive meals with qualities and ingredients; manage ingredients catalog.

**Independent Test**: Create meals with qualities/ingredients, update meal and ingredient details, archive meals (remain visible in history, excluded from active lists), and list meals with filters.

### Tests (write first)
- [ ] T032 [P] [US2] Write e2e tests for meal CRUD endpoints in `tests/e2e/meal.e2e.spec.ts`
- [ ] T033 [P] [US2] Write e2e tests for ingredient CRUD endpoints in `tests/e2e/ingredient.e2e.spec.ts`
- [ ] T034 [P] [US2] Write unit tests for Meal entity and MealQualities mutual exclusivity in `tests/unit/domain/meal/meal.spec.ts`
- [ ] T035 [P] [US2] Write unit tests for Ingredient entity and storage type validation in `tests/unit/domain/ingredient/ingredient.spec.ts`

### Implementation
- [ ] T036 [P] [US2] Implement Meal entity and MealQualities value object in `src/domain/meal/`
- [ ] T037 [P] [US2] Implement Ingredient entity in `src/domain/ingredient/ingredient.entity.ts`
- [ ] T038 [P] [US2] Implement meal and ingredient repository interfaces in `src/domain/meal/meal.repository.ts` and `src/domain/ingredient/ingredient.repository.ts`
- [ ] T039 [P] [US2] Implement meal use cases (create, update, archive, list) in `src/application/meal/`
- [ ] T040 [P] [US2] Implement ingredient use cases (create, update, delete, list) in `src/application/ingredient/`
- [ ] T041 [P] [US2] Add Prisma repositories for meals and ingredients in `src/infrastructure/database/repositories/prisma-meal.repository.ts` and `prisma-ingredient.repository.ts`
- [ ] T042 [P] [US2] Add DTOs and validators for meals/ingredients in `src/infrastructure/http/dtos/meal.dto.ts` and `ingredient.dto.ts`
- [ ] T043 [US2] Implement meal controller endpoints (list/create/get/update/archive) in `src/infrastructure/http/controllers/meal.controller.ts`
- [ ] T044 [US2] Implement ingredient controller endpoints in `src/infrastructure/http/controllers/ingredient.controller.ts`
- [ ] T045 [US2] Add integration tests for meal and ingredient repositories in `tests/integration/repositories/meal.repository.spec.ts` and `ingredient.repository.spec.ts`

## Phase 5: User Story 4 - Configure Personal Meal Preferences (Priority: P2)

**Goal**: Tenant admins can configure week start day and daily quality preferences; non-admins can view but not modify.

**Independent Test**: Admin updates weekStartDay and daily quality flags; non-admin update attempts are forbidden; eligible meals reflect updated preferences.

### Tests (write first)
- [ ] T046 [P] [US4] Write e2e tests for user-settings GET/PUT endpoints in `tests/e2e/user-settings.e2e.spec.ts`
- [ ] T047 [P] [US4] Write unit tests for UserSettings validation (7-day coverage, flags) in `tests/unit/domain/user/user-settings.spec.ts`

### Implementation
- [ ] T048 [P] [US4] Implement UserSettings entity with validation in `src/domain/user/user-settings.entity.ts`
- [ ] T049 [P] [US4] Ensure user repository interface supports tenant admin lookup in `src/domain/user/user.repository.ts`
- [ ] T050 [P] [US4] Implement user-settings use cases (get, update with admin check) in `src/application/user-settings/`
- [ ] T051 [P] [US4] Add Prisma repositories for user and user-settings in `src/infrastructure/database/repositories/prisma-user.repository.ts`
- [ ] T052 [P] [US4] Add DTOs and validators for user-settings in `src/infrastructure/http/dtos/user-settings.dto.ts`
- [ ] T053 [US4] Implement user-settings controller in `src/infrastructure/http/controllers/user-settings.controller.ts`
- [ ] T054 [US4] Add admin guard logic to auth middleware in `src/infrastructure/http/middleware/auth.middleware.ts`
- [ ] T055 [US4] Add integration tests for user-settings use cases in `tests/integration/usecases/user-settings.usecase.spec.ts`

## Phase 6: User Story 3 - Discover Meal Options with Random Selection (Priority: P3)

**Goal**: Users can request a random meal from eligible meals for a given day/meal-type; empty result handled gracefully.

**Independent Test**: With multiple eligible meals, random responses vary over repeated calls; with zero eligible meals, response is empty/message.

### Tests (write first)
- [ ] T056 [P] [US3] Write unit tests for random eligible meal selection in `tests/unit/application/meal/get-random-meal.usecase.spec.ts`
- [ ] T057 [P] [US3] Write e2e tests for `/meals/random` endpoint in `tests/e2e/meal-random.e2e.spec.ts`

### Implementation
- [ ] T058 [P] [US3] Implement random eligible meal use case using eligible-meal service in `src/application/meal/get-random-meal.usecase.ts`
- [ ] T059 [US3] Add random endpoint handler to meal controller in `src/infrastructure/http/controllers/meal.controller.ts`
- [ ] T060 [US3] Wire DI container for random meal use case in `src/infrastructure/di/container.ts`

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T061 [P] Validate OpenAPI alignment vs controllers and update `specs/001-001-meal-planning-api/contracts/openapi.yaml`
- [ ] T063 [P] Add security hardening (input validation schemas, rate limiting hooks) in `src/infrastructure/http/middleware/validation.middleware.ts`
- [ ] T064 [P] Update quickstart and README with final commands in `specs/001-001-meal-planning-api/quickstart.md` and `README.md`
- [ ] T065 Run full CI suite (lint, type-check, tests, coverage) before release

---

## Dependencies & Execution Order

- Phases must run sequentially: Setup → Foundational → US1 (P1) → US2 (P2) → US4 (P2) → US3 (P3) → Polish.
- US1 depends on Foundational completion and seeded meal/settings data; US2/US4 unlock dynamic meal library and preference updates; US3 depends on US1 eligible-meal service.

### Parallel Opportunities
- Setup: T003–T005 in parallel.
- Foundational: T008–T015 in parallel after Prisma schema (T006–T007).
- US1: T017–T020 tests in parallel; T021–T025 domain/app/repos in parallel; T027–T030 controllers/DI after DTOs (T026).
- US2: T032–T035 tests in parallel; T036–T042 implementation in parallel by component; T043–T044 after DTOs.
- US4: T046–T047 tests in parallel; T048–T052 implementation in parallel; T053–T055 after middleware/DTOs.
- US3: T056–T057 tests in parallel; T058–T060 implementation in parallel.
- Polish: T061–T064 in parallel.

## Implementation Strategy

- MVP: Complete Phases 1–3 (Setup, Foundational, US1) to deliver weekly planning with eligibility and leftovers.
- Incremental delivery: Add US2 (library) → US4 (preferences) → US3 (random) with independent validation after each phase.
- Test-first per constitution: execute listed tests before implementing corresponding components; maintain ≥80% coverage.

# Implementation Plan: Development Database Seed File

**Branch**: `002-dev-db-seed` | **Date**: February 13, 2026 | **Spec**: [spec.md](./spec.md) | **Tasks**: 47 total
**Input**: Feature specification from `/specs/002-dev-db-seed/spec.md`

## Summary

Create a deterministic Prisma seed script that populates the development database with realistic sample data: 10+ meals with diverse qualities, 15+ ingredients, user settings for 2+ tenants, and 2 seeded planned weeks (14 days total with ~50% meal coverage). The seed uses check-and-skip idempotency to prevent duplicates, logs all operations with optional verbose mode, and fails loudly on errors. All seed data will be hardcoded, deterministic, and vegan-aligned.

## Technical Context

**Language/Version**: TypeScript 5.x (matching project stack)  
**Primary Dependencies**: Prisma ORM, prisma seed CLI  
**Storage**: PostgreSQL (via Prisma client)  
**Testing**: Jest, e2e tests to verify seed integrity (run post-seed)  
**Target Platform**: Development environment (local Docker via docker-compose)  
**Project Type**: Monolithic backend with Prisma migrations  
**Performance Goals**: Seed execution <2 minutes including database reset  
**Constraints**: Check-and-skip idempotency (no destructive reset on re-run), deterministic UUID generation for reproducibility  
**Scale/Scope**: 2 tenants, 10 meals, 15 ingredients, 2 planned weeks per tenant (~70 records total)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Code Quality Standards** | ✅ PASS | Seed script will be clean, single-responsibility, DRY, and follow SOLID principles |
| **II. Clean Architecture** | ✅ PASS | Domain models used via Prisma; seed is infrastructure layer; business logic isolated |
| **III. Simple Regression Testing** | ✅ PASS | E2E tests verify seed output; integration tests validate multi-tenant isolation |
| **IV. Modular Code & DI** | ✅ PASS | Seed script modularized into helper functions; dependencies explicit (Prisma client injected) |
| **V. Performance Requirements** | ⚠️  CONDITIONAL | Seed execution <2min is achievable; post-seed API tests must verify <200ms response times |
| **VI. Domain Driven Design** | ✅ PASS | Seed uses domain terminology (Meal, Ingredient, DayPlan, Tenant); aggregates respected |
| **VII. Vegan-First Testing** | ✅ PASS | All seeded meals and ingredients are 100% plant-based; example recipes are vegan |

**Re-evaluation post-Phase 1 Design**: Required (Performance constraint verification)

## Project Structure

### Documentation (this feature)

```text
specs/002-dev-db-seed/
├── spec.md              # Feature specification
├── plan.md              # This file (implementation plan)
├── research.md          # Phase 0 output (best practices, patterns)
├── data-model.md        # Phase 1 output (seed data structure)
├── quickstart.md        # Phase 1 output (how-to guide)
├── SEEDING-GUIDE.md     # Phase 1 output (detailed seed usage docs)
└── checklists/
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
prisma/
├── schema.prisma        # (existing) Database schema
├── migrations/          # (existing) Migration history
├── seeds.ts             # NEW: Main seed script (TypeScript)
├── seed-data.ts         # NEW: Deterministic seed data (meals, ingredients, tenants)
└── seed-utils.ts        # NEW: Helper functions (UUID generation, logging, idempotency check)

tests/
├── e2e/
│   └── seeding.e2e.spec.ts  # NEW: Verify seed integrity and multi-tenant isolation
└── integration/
    └── seeding.integration.spec.ts  # NEW: Test seed utility functions

package.json             # (update) Add "prisma.seed" script
```

**Structure Decision**: Single monolithic backend with Prisma CLI. The seed script lives in `prisma/` following Prisma conventions. Helper functions are split into utility files for clarity and testability. E2E tests verify the output; integration tests validate utility functions.

## Complexity Tracking

No constitutional violations or complexity justifications required. The implementation follows all clean architecture and code quality standards:

- **No workarounds**: Check-and-skip idempotency is straightforward (query for seed marker)
- **No technical debt**: Modular helpers (seed-utils.ts) enable isolated testing and reusability
- **No framework violation**: Prisma client usage is appropriate for infrastructure layer
- **All DI explicit**: PrismaClient injected via constructor; no service locators

## Phase 0: Research

**Objective**: Identify best practices for Prisma seeding, deterministic UUID generation, and multi-tenant seed isolation.

**Research Tasks** (to be dispatched):

1. **Prisma Seed Patterns**: How to implement idempotent seeds with Prisma; check-and-skip pattern; error handling and logging
2. **Deterministic UUID Generation**: Methods for generating consistent UUIDs from strings (hashing); applying to tenant seeding
3. **Multi-Tenant Seed Isolation**: Best practices for seeding multiple isolated tenant contexts; RLS verification
4. **Seed Testing**: Integration and E2E test patterns for seed verification; performance measurement

**Output**: `research.md` with decision log for each question

## Phase 1: Design

**Objective**: Define seed data structure, create implementation contracts, and provide a quick-start guide.

### 1.1 Data Model (`data-model.md`)

Define the seed data structure with concrete examples:

- **Tenant Seed Data**: Fixed UUIDs for 2 test tenants (hash-derived for reproducibility)
- **Ingredient Seed Data**: 15 vegan ingredients distributed across storage types (FRIDGE, PANTRY, FROZEN, OTHER)
- **Meal Seed Data**: 10 meals with diverse qualities; each meal linked to 3-5 ingredients; example: "Creamy Cashew Alfredo Pasta" (isDinner, isCreamy, makesLunch)
- **User Settings Seed Data**: Per-tenant weekStartDay and daily quality preferences (realistic scheduling constraints)
- **Planned Week Seed Data**: 2 weeks per tenant starting from "next Monday"; 50% meal coverage (7 assignments across 14 day-slots)
- **Idempotency Marker**: Detect existing seed via a known meal or marker record (e.g., check if "Creamy Cashew Alfredo Pasta" exists)

### 1.2 API Contracts (None for seed; internal CLI command)

The seed is a CLI command (not a REST endpoint). No OpenAPI contracts needed.

### 1.3 Implementation Contracts (`SEEDING-GUIDE.md`)

- **How to Run**: `npm run prisma db seed` or `npx prisma db seed`
- **Expected Output**: Console logs showing each step (ingredients created, meals linked, tenants configured)
- **Idempotency**: Re-running produces no duplicates; empty database required for first run
- **Reset Procedure**: Manual delete via `prisma studio` or documented SQL; no built-in reset command
- **Verbose Mode**: `NODE_ENV=development npm run prisma db seed` for detailed logging
- **Error Handling**: Script exits with code 1 on error; all errors logged to console

### 1.4 Quick Start (`quickstart.md`)

Step-by-step guide for developers:
1. Clone repo
2. Run migrations: `npm run db:migrate`
3. Run seed: `npm run db:seed`
4. Verify: Check database via `prisma studio` or API calls
5. Example API calls to test with seeded data

## Phase 2: Implementation

**NOT CREATED BY THIS PLAN**: Task breakdown, detailed implementation steps, and acceptance criteria will be generated by `/speckit.tasks` command. This plan establishes the design and research foundation.

## Technical Decisions

| Decision | Rationale | Alternatives Considered |
|----------|-----------|------------------------|
| **Prisma Seed Script** | Standard, well-supported; integrates with `prisma db seed` CLI | Raw SQL scripts, manual npm script |
| **TypeScript** | Matches project stack; enables type safety for seed data | JavaScript (less type safety) |
| **Check-and-Skip Idempotency** | Prevents duplicates; safe for re-runs; developer-friendly | Hard reset on every run (destructive) |
| **Hardcoded Seed Data** | Deterministic, reproducible; matches dev expectations | Random generation (unpredictable) |
| **Hash-Derived UUIDs** | Consistent across seed runs; enables determinism | Random UUIDs (non-deterministic) |
| **Separate Utility Files** | Modular, testable; clean separation of concerns | Monolithic seed script (harder to test) |
| **Per-Tenant Seeding** | Enables multi-tenant isolation testing | Single tenant (insufficient for testing) |
| **Optional Verbose Logging** | Clear output for normal runs; detailed logs for debugging | Always verbose (noisy) or silent (opaque) |

## Success Metrics (Post-Implementation)

- Seed script runs in <2 minutes on clean database
- Seed data verifiable via Prisma Studio or API calls
- Multi-tenant isolation verified via integration tests
- At least 80% of seeded meals have unique ingredient combinations
- Re-running seed produces no duplicates (idempotency verified)
- E2E tests confirm eligible meal filtering works with seeded data
- Documentation enables new developers to seed database without assistance

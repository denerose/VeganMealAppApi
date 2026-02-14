# Implementation Plan: Seed Dev Test Users

**Branch**: `004-seed-dev-users` | **Date**: 2025-02-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/004-seed-dev-users/spec.md`

## Summary

Add exactly 3 dev test users to the seed script: 2 for Tenant-1 (one tenant admin, one regular) and 1 for Tenant-2 (tenant admin). All share one documented password; identities are deterministic; when a seed user already exists (by email), skip (do not create or update). Credentials are documented in the existing seeding guide (SEEDING-GUIDE or quickstart). Implementation extends existing seed data and seed-utils (new `SEED_DEV_USERS` in seed-data, user creation with skip-by-email in seed-utils, bcrypt for password hashing).

## Technical Context

**Language/Version**: TypeScript 5.x, Bun runtime  
**Primary Dependencies**: Prisma 7.x, bcrypt, uuid, pg  
**Storage**: PostgreSQL (Prisma); User model already exists (id, email, nickname, passwordHash, isTenantAdmin, tenantId)  
**Testing**: Bun test (unit + integration + e2e); `./scripts/check.sh` for validation  
**Target Platform**: Node/Bun server (API)  
**Project Type**: Single (API backend)  
**Performance Goals**: Seed completes in reasonable time; no new API endpoints  
**Constraints**: Skip-if-exists by email; deterministic UUIDs and emails; same bcrypt cost as app (10)  
**Scale/Scope**: 3 users total; dev/testing only

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|--------|
| I. Code Quality (clarity, SRP, DRY, SOLID, style, review) | Pass | Seed code follows existing patterns; no new modules beyond seed data + utils |
| II. Clean Architecture (layer separation, domain-first, interfaces) | Pass | Seed is infrastructure-only; no domain/application changes |
| III. Simple Regression Testing (test-first, unit coverage, fast, readable) | Pass | Tests for seed utilities and E2E already exist; add tests for dev-user creation and skip-if-exists |
| IV. Modular Code & DI | Pass | Seed uses existing Prisma client; bcrypt used directly in seed for hashing (no DI in seed script) |
| V. Performance | Pass | Seed remains fast; 3 users negligible |
| VI. DDD (ubiquitous language, aggregates) | Pass | User entity already in domain; seed aligns with User model |
| VII. Vegan-First Testing | Pass | No change to meal/ingredient data |
| Quality Gates (design review, test-first, check script) | Pass | Plan → tests → implement; use `bun run check` |

**No violations.** Complexity Tracking section left empty.

## Project Structure

### Documentation (this feature)

```text
specs/004-seed-dev-users/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (seed user entity view)
├── quickstart.md        # Phase 1 output (how to use seed dev users)
├── contracts/           # Phase 1: no new API (see contracts/README)
└── tasks.md             # Phase 2 output (/speckit.tasks - not created by plan)
```

### Source Code (repository root)

```text
prisma/
├── seed.ts              # Entry point (unchanged; may log usersCreated)
├── seed-data.ts         # Add SEED_DEV_USERS; deterministic emails, nicknames, tenantId, isTenantAdmin
├── seed-utils.ts        # Add: hash shared password (bcrypt 10); create dev users (skip if exists by email); SeedResult.usersCreated

docs/
├── SEEDING-GUIDE.md     # Add section: Seed dev users (emails, shared password, one admin per tenant)
├── quickstart.md        # Optional: short pointer to SEEDING-GUIDE for dev users

tests/
├── integration/         # Extend seeding tests: dev users count, tenant assignment, skip-if-exists
└── e2e/                 # Extend E2E: assert 3 users, 2 on T1 and 1 on T2
```

**Structure Decision**: No new top-level directories. Changes are confined to `prisma/` (seed-data, seed-utils, optionally seed.ts logging), `docs/` (SEEDING-GUIDE, optionally quickstart), and existing test files.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*None.*

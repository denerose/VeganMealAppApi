# Data Model: Seed Dev Users (004-seed-dev-users)

**Feature**: 004-seed-dev-users  
**Date**: 2025-02-15

## Scope

This feature does **not** change the Prisma schema. The `User` model already exists. This document describes the **seed data view** of the 3 dev users: attributes used in seed definitions and validation rules implied by the spec.

## Existing User model (unchanged)

Relevant fields from `prisma/schema.prisma`:

| Field         | Type    | Constraints / Notes                    |
|---------------|---------|----------------------------------------|
| id            | String  | UUID, primary key                      |
| email         | String  | Unique                                 |
| nickname      | String  | Display name                           |
| passwordHash  | String? | bcrypt hash (salt rounds 10)           |
| isTenantAdmin | Boolean | Default false                          |
| tenantId      | String  | FK to Tenant; cascade on delete        |
| createdAt     | DateTime| Default now()                          |
| updatedAt     | DateTime| Default now()                          |

Relations: `tenant`, `createdMeals`, `resetTokens`.

## Seed dev user entity (logical view)

The seed defines exactly 3 dev users with the following logical view:

| Attribute      | Rule / Source                                      |
|----------------|----------------------------------------------------|
| id             | Deterministic UUID via `deterministicUuid(seed)`   |
| email          | Deterministic, unique; used for skip-if-exists     |
| nickname       | Deterministic; documented in SEEDING-GUIDE         |
| passwordHash   | bcrypt hash of shared password (salt rounds 10)    |
| isTenantAdmin  | Exactly one true per tenant (T1: one admin, one regular; T2: one admin) |
| tenantId       | Tenant-1 or Tenant-2 (existing seed tenant IDs)    |

**Identity for idempotency**: Email is the identity for “same dev user”. If a user with that email already exists, the seed skips (does not create or update).

**Validation (from spec)**:

- Exactly 3 users total: 2 for Tenant-1, 1 for Tenant-2.
- Each user has exactly one tenant.
- Each tenant has exactly one seed user with `isTenantAdmin: true`; the remaining seed user(s) in that tenant have `isTenantAdmin: false`.
- All 3 share one password (stored as passwordHash per user; same plaintext documented).

## Relationship to existing seed entities

- **Tenant**: Dev users reference existing `SEED_TENANTS` by `tenantId`. No change to tenant creation.
- **System user**: Existing “system” users (per-tenant, no password) remain for `meal.createdBy`. Dev users are separate; they are not used as meal creators in the seed.
- **UserSettings**: Remain per-tenant (tenantId), not per-user. No change.

## State / lifecycle

- **Create**: Seed creates a user only when no user with that email exists.
- **No update**: If a user with the seed email exists, seed does not update any fields.
- **No delete**: Seed does not delete users.

No state machine; users are either present (created by seed or pre-existing) or not.

# Feature Specification: Seed Dev Test Users

**Feature Branch**: `004-seed-dev-users`  
**Created**: 2025-02-15  
**Status**: Draft  
**Input**: User description: "add 3 x users to the seed scripts (2 for Tenant-1 and 1 for Tenant-2) for dev testing."

## Clarifications

### Session 2025-02-15

- Q: Password strategy for the 3 seed users → A: One shared password for all 3 seed users (documented in one place).
- Q: Tenant admin role for seed users → A: One admin user for each tenant.
- Q: Where to document seed user credentials → A: In the existing seeding guide (e.g. SEEDING-GUIDE or quickstart).
- Q: Behaviour when a seed user already exists → A: Skip if exists (do not create or update; leave existing user unchanged).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Predictable test users for local development (Priority: P1)

Developers run the database seed and receive exactly three test user accounts: two associated with Tenant-1 and one with Tenant-2. Each user has stable, known identity data (e.g. email, display name, password) so developers can log in and test multi-tenant and multi-user flows without manually creating users.

**Why this priority**: Enables immediate dev testing of auth and tenant isolation; no manual user setup.

**Independent Test**: Run the seed once, then verify that exactly 3 users exist with the expected tenant assignments and that developers can use those credentials to sign in and access the correct tenant data.

**Acceptance Scenarios**:

1. **Given** a fresh or reset database, **When** the seed script runs successfully, **Then** exactly 3 users exist: 2 linked to Tenant-1 and 1 linked to Tenant-2.
2. **Given** the seed has run, **When** a developer inspects the data, **Then** each user has a distinct email and display name and is associated with exactly one tenant.
3. **Given** the seed has run, **When** a developer uses the provided user credentials, **Then** they can authenticate and access data scoped to that user’s tenant.

---

### User Story 2 - Seed remains idempotent with users (Priority: P2)

Re-running the seed script does not create duplicate users. If a seed user already exists (e.g. by email), the seed skips that user and does not update them; only missing users are created, so running the seed multiple times leaves the same three dev users (same count and tenant assignment).

**Why this priority**: Matches current seed behaviour (idempotent) and avoids duplicate or conflicting test accounts.

**Independent Test**: Run the seed twice (or run once, then run again). Verify that the total number of seed users is still 3 and that no duplicate identities exist for the defined dev users.

**Acceptance Scenarios**:

1. **Given** the seed has already run (including creating the 3 dev users), **When** the seed runs again, **Then** no additional users are created for the same dev-user identities (still 3 dev users total).
2. **Given** the seed runs multiple times, **When** a developer lists users per tenant, **Then** Tenant-1 has exactly 2 seed users and Tenant-2 has exactly 1 seed user.

---

### Edge Cases

- What happens when the database already has users with the same emails as the seed users? Seed MUST skip: do not create and do not update; leave existing user unchanged (skip by identity).
- How does the system handle running seed in an environment where only one tenant exists? Scope is fixed: 2 users for Tenant-1 and 1 for Tenant-2; both tenants are created by existing seed, so no change to tenant creation.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The seed script MUST create exactly 3 user accounts for development testing: 2 users for Tenant-1 and 1 user for Tenant-2.
- **FR-002**: Each seed user MUST be associated with exactly one tenant and MUST have a distinct email and display name (or equivalent identifier) that is documented or derivable for dev use.
- **FR-003**: Seed user identities (e.g. emails) MUST be deterministic so the same users are created on every run when they do not yet exist.
- **FR-004**: Re-running the seed MUST NOT create duplicate users for the same dev-user identities; when a seed user already exists (e.g. by email), the seed MUST skip (do not create, do not update; leave existing user unchanged).
- **FR-005**: The seed script MUST produce users that can be used to sign in and access tenant-scoped data for the purpose of manual and automated dev testing.
- **FR-006**: All 3 seed users MUST share a single documented password (one value for all; documented in one place).
- **FR-007**: Exactly one seed user per tenant MUST be a tenant admin (Tenant-1: one admin and one regular user; Tenant-2: one admin).
- **FR-008**: The shared password and seed user identities (e.g. emails) MUST be documented in the existing seeding guide (SEEDING-GUIDE or quickstart).

### Key Entities

- **Seed dev user**: A test user account created by the seed script, with a stable email and display name, linked to one tenant (Tenant-1 or Tenant-2), used only for development and testing. Each tenant has exactly one seed user who is a tenant admin; the remaining seed user(s) in that tenant are regular users.
- **Tenant**: Existing entity; Tenant-1 and Tenant-2 are created by the current seed. Seed users are assigned to these tenants as specified (2 for Tenant-1, 1 for Tenant-2).

## Assumptions

- Tenant-1 and Tenant-2 already exist from the current seed; no change to tenant creation is required.
- All 3 seed users share one password; credentials are documented in the existing seeding guide (SEEDING-GUIDE or quickstart) so developers can log in as any of them.
- Seed users are for development and testing only; no production use.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: After one successful seed run, developers can confirm exactly 3 users exist with 2 assigned to Tenant-1 and 1 to Tenant-2.
- **SC-002**: Running the seed a second time does not increase the number of seed users (no duplicate dev users).
- **SC-003**: Developers can complete sign-in and tenant-scoped access using the seeded user credentials without manual user creation.

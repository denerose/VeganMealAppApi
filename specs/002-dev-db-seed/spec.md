# Feature Specification: Development Database Seed File

**Feature Branch**: `002-dev-db-seed`  
**Created**: February 13, 2026  
**Status**: Draft  
**Input**: User description: "Plan a seed file for the development database with sample meals, ingredients, and user configurations"

## User Scenarios & Testing

### User Story 1 - Initialize Dev Environment with Sample Data (Priority: P1)

A developer clones the repository, sets up the database, and needs realistic sample data to begin working on features or testing the API without manually creating content.

**Why this priority**: This is the core value—enabling developers to immediately have a working environment with meaningful test data. Without this, every developer must manually create sample meals and ingredients before testing any feature.

**Independent Test**: Can be tested by running the seed script and verifying that the database contains expected meals, ingredients, and user settings. A developer should be able to immediately make API calls to list meals, get eligible meals, or create planned weeks.

**Acceptance Scenarios**:

1. **Given** a clean database after migration, **When** the seed script runs, **Then** the database contains at least 10 meals with diverse qualities and ingredients
2. **Given** a clean database, **When** the seed script runs, **Then** the database contains at least 15 unique ingredients with varied storage types
3. **Given** a clean database, **When** the seed script runs, **Then** the database contains default user settings with valid week start day and daily quality preferences

---

### User Story 2 - Seed Multiple Test Tenants (Priority: P2)

A developer needs to test multi-tenant isolation and row-level security features with separate meal libraries and settings per tenant, without manually creating duplicates.

**Why this priority**: Multi-tenant isolation is a core feature of this API. Developers need realistic tenant separation to test authorization and data isolation logic.

**Independent Test**: Can be tested by querying the database with different tenant IDs and verifying that meals and settings are properly isolated. A developer can switch tenant context and confirm they only see their own data.

**Acceptance Scenarios**:

1. **Given** the seed script runs for multiple tenants, **When** querying meals as Tenant A, **Then** only Tenant A's meals are returned
2. **Given** multiple tenants are seeded, **When** updating user settings for Tenant A, **Then** Tenant B's settings remain unchanged

---

### User Story 3 - Seed Meals with Complex Quality Combinations (Priority: P2)

A developer testing the eligible meal filtering logic needs meals with varied quality combinations (creamy, acidic, has green veg, etc.) to thoroughly test filtering by day and meal type.

**Why this priority**: Quality-based filtering is a key feature. Developers need diverse meal qualities to validate that the filtering logic works correctly across different preference combinations.

**Independent Test**: Can be tested by calling the eligible meals endpoint with various date and meal type parameters and verifying results match quality preferences for that day.

**Acceptance Scenarios**:

1. **Given** seeded meals with diverse qualities, **When** requesting eligible meals for Monday lunch with creamy preference, **Then** only creamy meals marked as lunch-suitable are returned
2. **Given** seeded meals, **When** requesting eligible meals for a day with no matching preferences, **Then** an empty array or appropriate message is returned

---

### User Story 4 - Seed Planned Week Structure for Testing (Priority: P3)

A developer testing planned week assignment logic needs sample planned weeks with partial meal assignments to test the day plan update and leftover population features.

**Why this priority**: Useful for testing advanced features, but not critical—developers can create planned weeks manually if needed. This accelerates testing of complex workflows.

**Independent Test**: Can be tested by retrieving a seeded planned week, verifying its structure includes 7 day plans, and testing meal assignment updates on those day plans.

**Acceptance Scenarios**:

1. **Given** seeded planned weeks, **When** retrieving the first week, **Then** it contains exactly 7 day plans with correct dates starting from next Monday
2. **Given** seeded planned weeks, **When** retrieving the second week, **Then** it contains exactly 7 day plans with correct dates starting from 14 days out
3. **Given** seeded planned weeks with 50% meal coverage (7 total assignments), **When** viewing day plans, **Then** some slots are filled and others are empty, enabling assignment testing
4. **Given** seeded planned weeks with dinner assignments, **When** testing leftover population, **Then** eligible dinners populate next day's lunch

---

### Edge Cases

- What happens if the seed script is run on a database that already has data? (Idempotent or error?)
- How should meals with the same name but different ingredients be handled to ensure diversity?
- What should happen if a user runs the seed script multiple times in development? (Should it reset or append?)
- How are user IDs and tenant IDs generated in the seed to ensure they're realistic UUIDs?

## Requirements

### Functional Requirements

- **FR-001**: Seed script MUST populate the database with at least 10 distinct meals with varying qualities and ingredients
- **FR-002**: Seed script MUST create at least 15 unique ingredients with distributed storage types (FRIDGE, PANTRY, FROZEN, OTHER)
- **FR-003**: Seed script MUST establish user settings for each seeded tenant with a valid week start day (MONDAY, SATURDAY, or SUNDAY)
- **FR-004**: Seed script MUST configure daily quality preferences for all 7 days of the week for each tenant
- **FR-005**: Meals MUST include a diverse mix of qualities (dinner-only, lunch-suitable, creamy, acidic, with green vegetables, makes leftovers, easy to make, needs prep)
- **FR-006**: Meals MUST be linked to ingredients such that at least 5 meals have 5+ ingredients each
- **FR-007**: Seed script MUST create sample data for at least 2 separate tenants to enable multi-tenant testing
- **FR-008**: Seed script MUST be deterministic—running it multiple times with the same configuration produces the same data
- **FR-009**: Seed data MUST include realistic meal names, recipe links, and image ID placeholders
- **FR-010**: Seed script MUST be reversible or idempotent (developer can reset the database to a clean seeded state)
- **FR-011**: All seeded records MUST have valid timestamps (createdAt, updatedAt) in ISO 8601 format
- **FR-012**: Seeded meal assignments in planned weeks MUST respect the tenant's weekStartDay configuration

### Key Entities

- **Meal**: A dish with a name, optional recipe link, optional image ID, and a set of quality flags (isDinner, isLunch, isCreamy, etc.). Seeded meals should represent common vegan dishes with realistic proportions (some easy/creamy dinners, some lunch options with leftovers).

- **Ingredient**: A pantry item with a name, storage type, and staple flag. Seeded ingredients should represent common vegan pantry items (coconut milk, pasta, tofu, vegetables, spices, etc.) distributed across storage types.

- **User Settings**: Tenant-level configuration including weekStartDay preference and per-day quality preferences. Each seeded tenant should have meaningful preferences reflecting realistic scheduling constraints (e.g., prefer easy meals on busy days).

- **Planned Week**: A 7-day meal planning structure starting from a specific date. Seeded planned weeks should include partial meal assignments to enable testing of assignment updates and leftover logic.

- **Tenant**: A logical organizational boundary for multi-tenant data isolation. Seeded tenants should have distinct meal libraries and settings to enable testing of isolation.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Developers can run the seed script and be ready to test API endpoints within 2 minutes (including database reset time)
- **SC-002**: At least 80% of seeded meals have unique name-ingredient combinations for realistic test diversity
- **SC-003**: Seeded data covers all 9 meal qualities with at least 2 meals per quality combination (to test filtering edge cases)
- **SC-004**: Multi-tenant seed data is fully isolated—no tenant can access another tenant's meals through queries
- **SC-005**: Seed script completes without errors on a clean database migrated with current schema
- **SC-006**: Documentation is available explaining how to run the seed, reset it, and customize seed data for specific test scenarios

## Assumptions

- **Tech Stack**: The seed file will be implemented as a Prisma seed script (seeds.ts or seeds.js in the prisma/ directory), executed via `prisma db seed` or similar command configured in package.json. This is a standard Prisma pattern and aligns with the project's existing setup.

- **Data Generation**: Meal names, ingredient names, and recipe links will be hardcoded realistic values (not randomly generated). This ensures deterministic, reproducible data that matches developer expectations.

- **Tenant Handling**: Seeded tenants will be assigned fixed, deterministic UUIDs (e.g., derived from hashing tenant names) rather than random UUIDs, ensuring consistency across seed runs.

- **User/Creator IDs**: Meals will be attributed to a default system user (with a fixed UUID). In a real authentication context, this would be replaced with an actual authenticated user ID, but for dev seeding, a deterministic placeholder is sufficient.

- **Idempotency**: The seed script will be idempotent using a check-and-skip approach. On execution, the script checks if seed data already exists (by looking for a marker record or known seed meal) and skips insertion if present. This prevents duplicate data if `prisma db seed` is run multiple times. Developers who want a fresh seed can manually delete seeded data or use a separate documented reset procedure.

- **Scope**: The seed file will NOT mock external services (image CDNs, recipe APIs, etc.). Image IDs and recipe links will be placeholder values suitable for development.

- **Leftover Logic**: Planned weeks will only include starter assignments (no complex leftover chains). Full leftover population can be tested via API endpoints after seeding.

- **Partial Meal Coverage**: Seeded planned weeks include approximately 50% meal coverage (7 meal assignments total across 14 day-slots in 2 weeks). This provides sufficient reference data for testing without creating a fully pre-populated schedule. Empty slots allow developers to test the assignment and update logic without overwriting existing data.

- **Documentation**: Seed execution, reset procedures, and customization instructions will be documented in a dedicated `SEEDING-GUIDE.md` file within the spec directory (`specs/002-dev-db-seed/`). This provides a discoverable, maintainable reference for developers without cluttering the seed script itself.

- **Error Handling & Logging**: The seed script will log all operations (meals created, ingredients seeded, etc.) to console output. Normal runs show summary progress; optional verbose mode (e.g., `--verbose` flag) provides detailed transaction logs for troubleshooting. Any error (constraint violations, schema issues, missing data) will be logged clearly and cause the script to exit with non-zero status, preventing silent failures in CI/CD pipelines.

## Clarifications

### Session 2026-02-13

- Q: How should the seed script handle idempotency—always reset, check-and-skip, or flag-based? → A: Check-and-skip approach (detect existing seed data and skip if present to prevent duplicates)
- Q: How many planned weeks should be seeded and for what date range? → A: Seed 2 planned weeks starting from next Monday (covering 1-2 weeks ahead)
- Q: What level of meal assignment coverage for seeded weeks? → A: 50% coverage (7 meals across 14 day-slots) providing reference data while leaving space for testing assignments
- Q: What form should seed documentation take? → A: Separate `SEEDING-GUIDE.md` file in the spec directory for discoverability and maintainability
- Q: How should the seed script handle logging and error reporting? → A: Log all operations to console with optional verbose mode; fail loudly (exit non-zero) on errors

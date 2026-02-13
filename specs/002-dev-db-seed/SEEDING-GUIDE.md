# SEEDING-GUIDE.md: Implementation & Usage Guide

**Date**: February 13, 2026  
**Purpose**: Detailed guide for implementing, maintaining, and troubleshooting the seed script

---

## Table of Contents

1. [Implementation Overview](#implementation-overview)
2. [File Structure](#file-structure)
3. [Usage Instructions](#usage-instructions)
4. [Error Handling](#error-handling)
5. [Testing & Verification](#testing--verification)
6. [Customization](#customization)
7. [Troubleshooting](#troubleshooting)

---

## Implementation Overview

The seed script is implemented in **TypeScript** using **Prisma ORM** and follows clean architecture principles:

- **Entry Point**: `prisma/seed.ts` (main script; invoked via `bun run prisma/seed.ts` in `package.json` under `db:seed`)
- **Data Definitions**: `prisma/seed-data.ts` (hardcoded, deterministic: `SEED_TENANTS`, `SEED_INGREDIENTS`, `SEED_MEALS`, `SEED_USER_SETTINGS`)
- **Utilities**: `prisma/seed-utils.ts` (helper functions: `deterministicUuid`, logging, `checkIdempotency`, `seedDatabase`)
- **Tests**: `tests/integration/seeding.integration.spec.ts` (utilities and DB-backed seed assertions)
- **Tests**: `tests/e2e/seeding.e2e.spec.ts` (full seed E2E verification)

### Design Principles

1. **Modularity**: Each function handles one responsibility (generate UUIDs, create meals, log progress)
2. **Testability**: Utilities are pure functions, easily isolated for testing
3. **Determinism**: All data is hardcoded; no randomness ensures reproducibility
4. **Idempotency**: Check-and-skip pattern prevents duplicate data
5. **Transparency**: Logs show every step; verbose mode provides detailed trace

---

## File Structure

### `prisma/seed.ts`

Main entry point. Called by `bun run db:seed` (runs `bun run prisma/seed.ts`). Creates a Prisma client (with optional pg adapter when `DATABASE_URL` is set), calls `seedDatabase(prisma)` from `seed-utils.ts`, and exits with code 0 on success or 1 on error.

### `prisma/seed-data.ts`

All seed data definitions: `SEED_TENANTS`, `SEED_INGREDIENTS`, `SEED_MEALS`, `SEED_USER_SETTINGS`. Exports `deterministicUuid(seed)` and `getSystemUserIdForTenant(tenantId)`. Meals reference ingredients by name; ingredients use `StorageType` enum and have `name`, `storageType`, `staple`. User settings include `weekStartDay` and `dailyPreferences` per day.

### `prisma/seed-utils.ts`

Reusable utilities: `deterministicUuid(seed)`, `log(message, level)`, `logVerbose(message)`, `checkIdempotency(prisma, tenantId)`, `seedDatabase(prisma)`. Imports seed data from `seed-data.ts` and performs the full orchestration (tenants → ingredients → meals → user settings → planned weeks and day plans). Returns a result object with counts (e.g. `mealsCreated`, `ingredientsCreated`, `tenantsCreated`).

### Test Files

**`tests/integration/seeding.integration.spec.ts`**: Tests for `deterministicUuid`, `checkIdempotency`, multi-tenant isolation, meal quality diversity, quality-based filtering, day plan assignments, 80% unique meal–ingredient combinations (SC-002), and seed determinism. Uses a shared Prisma client and runs the seed in `beforeAll` when needed.

**`tests/e2e/seeding.e2e.spec.ts`**: Full E2E: runs seed, then asserts on meal/ingredient/settings/planned week counts, week structure (7 day plans per week), partial slot coverage, and comprehensive user story coverage (US1–US4).

### `package.json` scripts

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:seed": "bun run prisma/seed.ts",
    "db:reset": "prisma migrate reset --force",
    "db:studio": "prisma studio"
  }
}
```

---

## Usage Instructions

### Running the Seed

```bash
# Normal run (summary output)
bun run db:seed

# With verbose logging
SEED_VERBOSE=true bun run db:seed

# After migrations
bun run db:migrate && bun run db:seed
```

### Configuration

Environment variables (optional):

| Variable | Default | Purpose |
|----------|---------|---------|
| `SEED_VERBOSE` | `false` | Enable detailed logging (set to `true`) |
| `DATABASE_URL` | (from `.env`) | Prisma database connection string |

### Expected Outputs

**Success**:
```
[12:34:56] ✓ Starting seed process...
[12:34:57] ✓ Seeding completed: 20 meals, 30 ingredients, 2 tenants
```

**Already Seeded**:
```
[12:34:56] ✓ Starting seed process...
[12:34:56] ✓ Seed data already exists, skipping seeding
```

**Error**:
```
[2026-02-13T10:30:45Z] ✗ Seed failed: Failed to create ingredient Tofu: Unique constraint failed on field 'Ingredient.tenantId_ingredientName'
[Exit code: 1]
```

---

## Error Handling

### Common Errors & Solutions

#### Error: "Seed data already exists. Skipping."

**Cause**: Seed was already run; idempotency marker found.

**Solutions**:
1. Use existing seeded data (preferred for development)
2. Reset database: `bun run db:reset`
3. Manually delete marker meal and re-run

#### Error: "Unique constraint failed"

**Cause**: Attempt to create duplicate meal or ingredient name.

**Solutions**:
1. Check database state: `bun run db:studio`
2. Delete conflicting records manually
3. Ensure no manual data inserted with same names

#### Error: "Connection timeout"

**Cause**: Database not running or not accessible.

**Solutions**:
```bash
# Check Docker
docker-compose ps

# Check connection string in .env
cat .env | grep DATABASE_URL

# Restart database
docker-compose restart postgres
```

#### Error: "Migration pending"

**Cause**: Schema migrations not applied.

**Solutions**:
```bash
bun run db:migrate
bun run db:seed
```

### Error Recovery

If seed fails mid-execution:

1. **Check logs**: Review console output for specific error
2. **Inspect database**: Use `prisma studio` to see partial data
3. **Decide**:
   - If partial seed acceptable: Continue with development
   - If full reset needed: `bun run db:reset` then `bun run db:seed`
4. **Review code**: Check `prisma/seed-data.ts` for data issues

---

## Testing & Verification

### Run All Seed Tests

```bash
bun test seeding
# or run full check: bun run check
```

### Manual Verification

#### Count Records
```bash
bun run db:studio
# Click on each table to see record counts
```

#### Check Multi-Tenant Isolation
```bash
curl -X GET http://localhost:3000/api/v1/meals \
  -H "Authorization: Bearer <tenant-1-token>"
# Should only return Tenant-1 meals
```

#### Verify Meal Qualities
```bash
curl -X GET "http://localhost:3000/api/v1/meals/eligible?date=2026-02-16&mealType=lunch" \
  -H "Authorization: Bearer <token>"
# Should return meals matching Monday lunch preferences
```

### Performance Verification

Measure seed execution time:
```bash
time bun run db:seed
# Output: real 0m2.341s (under 2 minutes ✓)
```

---

## Customization

### Adding a New Meal

1. Edit `prisma/seed-data.ts`: add a new entry to the `SEED_MEALS` array following the existing shape (`mealName`, `qualities` object, `ingredientNames` array, optional `recipeLink`/`imageId`).

2. **Remove the idempotency marker** to re-seed (or run `bun run db:reset` then migrate and seed again):
   ```sql
   DELETE FROM "Meal" WHERE "mealName" = 'Creamy Cashew Alfredo Pasta';
   ```

3. Re-run: `bun run db:seed`

### Adding More Test Tenants

Modify `SEED_TENANTS` in `prisma/seed-data.ts`:
```typescript
export const SEED_TENANTS = [
  { id: deterministicUuid('Tenant-1'), name: 'Test Tenant 1' },
  { id: deterministicUuid('Tenant-2'), name: 'Test Tenant 2' },
  { id: deterministicUuid('Tenant-3'), name: 'Test Tenant 3' }, // New
];
```
Then extend `SEED_USER_SETTINGS` and ensure seed-utils iterates over all tenants.

### Changing Idempotency Marker

If "Creamy Cashew Alfredo Pasta" becomes a user-created meal in production, change the marker in `prisma/seed-utils.ts`: in `checkIdempotency`, replace the `mealName` in the `where` clause with a constant (e.g. `MARKER_MEAL_NAME`) and set it to a distinct seed-only meal name. Ensure that meal is still created by the seed so the check remains valid.

---

## Troubleshooting

### Issue: "SEED_VERBOSE not working"

Ensure environment variable is set before command:

```bash
# Wrong
bun run db:seed SEED_VERBOSE=true

# Correct
SEED_VERBOSE=true bun run db:seed
```

### Issue: "Seed runs but no data appears"

1. Check exit code: `echo $?` (should be 0)
2. Verify database connection: `npx prisma studio`
3. Check idempotency: Seed may have skipped if marker exists
4. Enable verbose logging: `SEED_VERBOSE=true bun run db:seed`

### Issue: "Old seed data interferes with new tests"

Solution: Reset between test runs:

```bash
bun run db:reset
bun run check
```

### Issue: "Performance degradation over time"

Seed gets slower after multiple runs due to accumulation. Fix:

```bash
bun run db:reset  # Clears and re-initializes schema
bun run db:seed   # Fresh seed
```

---

## Support & Questions

- **Implementation Details**: See `prisma/seed.ts`, `seed-data.ts`, `seed-utils.ts`
- **Data Structure**: See [data-model.md](./data-model.md)
- **Quick Start**: See [quickstart.md](./quickstart.md)
- **Design Decisions**: See [research.md](./research.md)

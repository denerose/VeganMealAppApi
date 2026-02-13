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

- **Entry Point**: `prisma/seeds.ts` (main script, registered in `package.json`)
- **Data Definitions**: `prisma/seed-data.ts` (hardcoded, deterministic seed data)
- **Utilities**: `prisma/seed-utils.ts` (helper functions: UUID generation, logging, idempotency)
- **Tests**: `tests/integration/seeding.integration.spec.ts` (unit tests for utilities)
- **Tests**: `tests/e2e/seeding.e2e.spec.ts` (full seed verification)

### Design Principles

1. **Modularity**: Each function handles one responsibility (generate UUIDs, create meals, log progress)
2. **Testability**: Utilities are pure functions, easily isolated for testing
3. **Determinism**: All data is hardcoded; no randomness ensures reproducibility
4. **Idempotency**: Check-and-skip pattern prevents duplicate data
5. **Transparency**: Logs show every step; verbose mode provides detailed trace

---

## File Structure

### `prisma/seeds.ts`

Main entry point. Called by `npm run db:seed`.

```typescript
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from './seed-utils';

const prisma = new PrismaClient();

async function main() {
  console.log(`[${new Date().toISOString()}] Starting database seed...`);
  
  try {
    const result = await seedDatabase(prisma);
    console.log(`[${new Date().toISOString()}] ✓ Seed completed in ${result.duration}ms`);
    process.exit(0);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Seed failed: ${error.message}`);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
```

### `prisma/seed-data.ts`

All seed data definitions in one place for easy auditing and modification.

```typescript
import { UUID } from './seed-utils';

export const seedTenants = [
  {
    id: deterministicUuid('Tenant-1'),
    name: 'Test Tenant 1',
  },
  {
    id: deterministicUuid('Tenant-2'),
    name: 'Test Tenant 2',
  },
];

export const seedIngredients = (tenantId: UUID) => [
  {
    id: UUID.v4(), // Can be random; no cross-tenant reference
    ingredientName: 'Tofu',
    staple: true,
    storageType: 'FRIDGE',
    tenantId,
  },
  // ... 14 more ingredients
];

export const seedMeals = (tenantId: UUID, ingredients: Ingredient[]) => [
  {
    id: UUID.v4(),
    mealName: 'Creamy Cashew Alfredo Pasta',
    isDinner: true,
    isLunch: false,
    isCreamy: true,
    ingredients: [
      ingredients.find(i => i.ingredientName === 'Pasta'),
      ingredients.find(i => i.ingredientName === 'Cashews'),
      // ...
    ],
    tenantId,
  },
  // ... 9 more meals
];

// ... similar functions for user settings, planned weeks, day plans
```

### `prisma/seed-utils.ts`

Reusable utilities imported by seeds.ts and tests.

```typescript
import crypto from 'crypto';
import { v5 as uuidv5 } from 'uuid';
import { PrismaClient } from '@prisma/client';

const SEED_NAMESPACE = '123e4567-e89b-12d3-a456-426614174000';

export function deterministicUuid(seed: string): string {
  return uuidv5(seed, SEED_NAMESPACE);
}

export async function checkIdempotency(
  prisma: PrismaClient,
  tenantId: string
): Promise<boolean> {
  const markerMeal = await prisma.meal.findFirst({
    where: {
      mealName: 'Creamy Cashew Alfredo Pasta',
      tenantId,
    },
  });
  return !!markerMeal;
}

export function log(message: string, level: 'info' | 'error' = 'info'): void {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '✗' : '✓';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

export function logVerbose(message: string): void {
  if (process.env.SEED_VERBOSE === 'true') {
    log(`[VERBOSE] ${message}`, 'info');
  }
}

export async function seedDatabase(
  prisma: PrismaClient
): Promise<{ duration: number }> {
  const startTime = Date.now();

  // Main seeding logic here
  // ...

  return { duration: Date.now() - startTime };
}
```

### Test Files

**`tests/integration/seeding.integration.spec.ts`**: Unit tests for seed utilities

```typescript
import { deterministicUuid } from '@/prisma/seed-utils';

describe('Seed utilities', () => {
  test('deterministicUuid produces consistent IDs', () => {
    const id1 = deterministicUuid('test-seed');
    const id2 = deterministicUuid('test-seed');
    expect(id1).toBe(id2);
  });

  test('deterministicUuid differs for different seeds', () => {
    const id1 = deterministicUuid('seed-1');
    const id2 = deterministicUuid('seed-2');
    expect(id1).not.toBe(id2);
  });
});
```

**`tests/e2e/seeding.e2e.spec.ts`**: Full seed execution tests

```typescript
import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '@/prisma/seed-utils';

describe('Seed E2E', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
  });

  test('Seed creates expected data count', async () => {
    const result = await seedDatabase(prisma);
    expect(result.duration).toBeLessThan(120000); // < 2 minutes

    const mealCount = await prisma.meal.count();
    const ingredientCount = await prisma.ingredient.count();
    
    expect(mealCount).toBeGreaterThanOrEqual(10);
    expect(ingredientCount).toBeGreaterThanOrEqual(15);
  });

  test('Multi-tenant isolation is enforced', async () => {
    const tenants = await prisma.userSettings.findMany();
    expect(tenants.length).toBeGreaterThanOrEqual(2);

    const tenant1Meals = await prisma.meal.findMany({
      where: { tenantId: tenants[0].tenantId },
    });

    tenant1Meals.forEach(meal => {
      expect(meal.tenantId).toBe(tenants[0].tenantId);
    });
  });
});
```

### `package.json` Update

Add seed script to `package.json`:

```json
{
  "scripts": {
    "db:migrate": "prisma migrate dev",
    "db:seed": "node -r ts-node/register prisma/seeds.ts",
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
npm run db:seed

# With verbose logging
SEED_VERBOSE=true npm run db:seed

# After migrations
npm run db:migrate && npm run db:seed
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
[2026-02-13T10:30:45Z] ✓ Starting database seed...
[2026-02-13T10:30:45Z] ✓ Checking for existing seed data...
[2026-02-13T10:30:46Z] ✓ Creating 2 tenants and user settings...
[2026-02-13T10:30:46Z] ✓ Creating 15 ingredients per tenant...
[2026-02-13T10:30:47Z] ✓ Creating 10 meals per tenant...
[2026-02-13T10:30:47Z] ✓ Creating 2 planned weeks per tenant...
[2026-02-13T10:30:48Z] ✓ Seed completed in 3000ms
```

**Already Seeded**:
```
[2026-02-13T10:30:45Z] ✓ Starting database seed...
[2026-02-13T10:30:45Z] ✓ Seed data already exists. Skipping.
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
2. Reset database: `npm run db:reset`
3. Manually delete marker meal and re-run

#### Error: "Unique constraint failed"

**Cause**: Attempt to create duplicate meal or ingredient name.

**Solutions**:
1. Check database state: `npx prisma studio`
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
npm run db:migrate
npm run db:seed
```

### Error Recovery

If seed fails mid-execution:

1. **Check logs**: Review console output for specific error
2. **Inspect database**: Use `prisma studio` to see partial data
3. **Decide**:
   - If partial seed acceptable: Continue with development
   - If full reset needed: `npm run db:reset && npm run db:seed`
4. **Review code**: Check `prisma/seed-data.ts` for data issues

---

## Testing & Verification

### Run All Seed Tests

```bash
npm test -- --testPathPattern=seeding
```

### Manual Verification

#### Count Records
```bash
npx prisma studio
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
time npm run db:seed
# Output: real 0m2.341s (under 2 minutes ✓)
```

---

## Customization

### Adding a New Meal

1. Edit `prisma/seed-data.ts`:
   ```typescript
   export const seedMeals = (tenantId: UUID, ingredients: Ingredient[]) => [
     // ... existing meals ...
     {
       id: UUID.v4(),
       mealName: 'My New Vegan Dish',
       qualities: { isDinner: true, isLunch: false, ... },
       ingredients: [ ... ],
       tenantId,
     },
   ];
   ```

2. **Remove the idempotency marker** to re-seed:
   ```sql
   DELETE FROM "Meal" WHERE "mealName" = 'Creamy Cashew Alfredo Pasta';
   ```

3. Re-run: `npm run db:seed`

### Adding More Test Tenants

Modify `seedTenants` in `prisma/seed-data.ts`:
```typescript
export const seedTenants = [
  { id: deterministicUuid('Tenant-1'), name: 'Test Tenant 1' },
  { id: deterministicUuid('Tenant-2'), name: 'Test Tenant 2' },
  { id: deterministicUuid('Tenant-3'), name: 'Test Tenant 3' }, // New
];
```

### Changing Idempotency Marker

If "Creamy Cashew Alfredo Pasta" becomes a user-created meal in production, change marker:

```typescript
// In seed-utils.ts
const MARKER_MEAL_NAME = 'My New Marker Meal';

export async function checkIdempotency(
  prisma: PrismaClient,
  tenantId: string
): Promise<boolean> {
  const markerMeal = await prisma.meal.findFirst({
    where: { mealName: MARKER_MEAL_NAME, tenantId },
  });
  return !!markerMeal;
}
```

---

## Troubleshooting

### Issue: "SEED_VERBOSE not working"

Ensure environment variable is set before command:

```bash
# Wrong
npm run db:seed SEED_VERBOSE=true

# Correct
SEED_VERBOSE=true npm run db:seed
```

### Issue: "Seed runs but no data appears"

1. Check exit code: `echo $?` (should be 0)
2. Verify database connection: `npx prisma studio`
3. Check idempotency: Seed may have skipped if marker exists
4. Enable verbose logging: `SEED_VERBOSE=true npm run db:seed`

### Issue: "Old seed data interferes with new tests"

Solution: Reset between test runs:

```bash
npm run db:reset
npm test
```

### Issue: "Performance degradation over time"

Seed gets slower after multiple runs due to accumulation. Fix:

```bash
npm run db:reset  # Clears and re-initializes
npm run db:seed   # Fresh seed
```

---

## Support & Questions

- **Implementation Details**: See `prisma/seeds.ts`, `seed-data.ts`, `seed-utils.ts`
- **Data Structure**: See [data-model.md](./data-model.md)
- **Quick Start**: See [quickstart.md](./quickstart.md)
- **Design Decisions**: See [research.md](./research.md)

# Research Findings: Database Seeding & Deterministic Data

**Date**: February 13, 2026  
**Feature**: Development Database Seed File  
**Researcher**: Implementation Planning Phase  

---

## Question 1: Prisma Seed Patterns & Idempotency

### Decision: Check-and-Skip Idempotency Pattern

**What we chose**: Query the database for a known seed marker (e.g., check if "Creamy Cashew Alfredo Pasta" meal exists). If present, skip seeding. If not, proceed with full seed.

**Why this is best practice**:
1. **Safety**: No destructive operations on existing data
2. **Efficiency**: Avoids redundant inserts when re-running `prisma db seed`
3. **CI/CD Friendly**: Won't fail in environments where seed has already run
4. **Developer Experience**: Developers can re-run seed script without manual cleanup

**Implementation approach**:
```typescript
// Check for seed marker
const existingMeal = await prisma.meal.findFirst({
  where: { mealName: "Creamy Cashew Alfredo Pasta" }
});

if (existingMeal) {
  console.log("Seed data already exists. Skipping.");
  return;
}

// Proceed with seeding...
```

**Error handling**: All Prisma operations wrapped in try-catch. On error:
- Log error with context (which entity failed, why)
- Exit process with code 1 (non-zero for CI detection)
- Use `console.error()` for visibility

**Logging pattern**: 
```typescript
console.log(`✓ Created meal: ${meal.mealName}`);
console.error(`✗ Failed to create ingredient ${name}: ${error.message}`);
```

**Source**: Prisma documentation (prisma.io/docs/orm/prisma-client/deployment/seed-database) recommends this pattern for production-safe seeding.

---

## Question 2: Deterministic UUID Generation

### Decision: Hash-Based UUID Generation from String Seeds

**What we chose**: Use `crypto.createHash('sha256')` to derive consistent UUIDs from tenant names. This ensures:
- Same tenant name always produces same UUID
- Reproducible across seed runs
- No randomness (deterministic)

**Implementation approach**:
```typescript
import crypto from 'crypto';
import { v5 as uuidv5 } from 'uuid';

const SEED_NAMESPACE = '123e4567-e89b-12d3-a456-426614174000';

function deterministicUuid(seed: string): string {
  return uuidv5(seed, SEED_NAMESPACE);
}

// Usage:
const tenant1Id = deterministicUuid('Tenant-1');
const tenant2Id = deterministicUuid('Tenant-2');
```

**Why UUID v5 (namespace + SHA-1)**: 
- Guarantees same seed → same UUID
- RFC 4122 compliant
- Built into Node.js ecosystem (via `uuid` package, already likely in dependencies)

**Default system user UUID**: Use a fixed UUID for "seed system user":
```typescript
const SEED_SYSTEM_USER_ID = deterministicUuid('system:seed-user');
```

**Advantage over UUID v4 (random)**:
- Reproducible: Developers see consistent IDs across runs
- Testable: Tests can predict expected IDs
- Debuggable: Same seed name always produces same ID (easier to trace issues)

**Source**: RFC 4122 (UUID specification); Node.js `uuid` package docs; Prisma best practices.

---

## Question 3: Multi-Tenant Seed Isolation

### Decision: Seed Each Tenant Independently with Isolated Data

**What we chose**: Create 2 distinct tenants with separate meal libraries, ingredients, and user settings. No shared data between tenants.

**Implementation approach**:

```typescript
const tenants = [
  {
    id: deterministicUuid('Tenant-1'),
    name: 'Test Tenant 1',
    weekStartDay: 'MONDAY',
  },
  {
    id: deterministicUuid('Tenant-2'),
    name: 'Test Tenant 2',
    weekStartDay: 'SUNDAY',
  },
];

for (const tenant of tenants) {
  // Create tenant settings
  await prisma.userSettings.create({
    data: {
      id: deterministicUuid(`settings:${tenant.id}`),
      tenantId: tenant.id,
      weekStartDay: tenant.weekStartDay,
      dailyPreferences: [...], // 7 days of preferences
    },
  });

  // Create tenant-scoped meals
  const meals = await createMealsForTenant(prisma, tenant.id);
  
  // Create tenant-scoped ingredients
  const ingredients = await createIngredientsForTenant(prisma, tenant.id);
  
  // Create tenant-scoped planned weeks
  const weeks = await createPlannedWeeksForTenant(prisma, tenant.id);
}
```

**Isolation verification**: After seeding, verify via integration tests:
```typescript
// When querying Tenant-1, should only see Tenant-1's meals
const tenant1Meals = await prisma.meal.findMany({
  where: { tenantId: tenant1Id },
});
expect(tenant1Meals.every(m => m.tenantId === tenant1Id)).toBe(true);
```

**Prisma-level isolation**: Seed respects `tenantId` field in all queries. No cross-tenant leakage.

**Why this approach**:
- Enables testing of multi-tenant query filtering
- Validates RLS (Row-Level Security) logic if implemented later
- Realistic: Each tenant has distinct meal libraries in production

**Source**: Prisma multi-tenancy docs; common SaaS testing patterns.

---

## Question 4: Seed Testing Strategy

### Decision: Combination of Integration Tests + E2E Tests

**What we chose**:

#### Integration Tests (Unit-level)
Test seed utility functions in isolation:
```typescript
describe('Seed utilities', () => {
  test('deterministicUuid produces same ID for same seed', () => {
    const id1 = deterministicUuid('test');
    const id2 = deterministicUuid('test');
    expect(id1).toBe(id2);
  });

  test('createMealsForTenant respects tenant isolation', async () => {
    const meals = await createMealsForTenant(prisma, tenantId);
    expect(meals.every(m => m.tenantId === tenantId)).toBe(true);
  });
});
```

#### E2E Tests (Full seed verification)
Run full seed and verify output:
```typescript
describe('Seed script E2E', () => {
  beforeAll(async () => {
    // Run seed
    await require('../prisma/seeds.ts').main();
  });

  test('Seed creates 10+ meals', async () => {
    const mealCount = await prisma.meal.count();
    expect(mealCount).toBeGreaterThanOrEqual(10);
  });

  test('Multi-tenant data is isolated', async () => {
    const tenant1Meals = await prisma.meal.findMany({
      where: { tenantId: tenant1Id },
    });
    expect(tenant1Meals.every(m => m.tenantId === tenant1Id)).toBe(true);
  });

  test('Eligible meals filtering works post-seed', async () => {
    const eligible = await getEligibleMeals(tenant1Id, 'MONDAY', 'lunch');
    // Should return meals matching preferences
    expect(eligible.length).toBeGreaterThan(0);
  });
});
```

**Performance measurement**:
```typescript
test('Seed completes in under 2 minutes', async () => {
  const start = Date.now();
  await runSeed();
  const duration = Date.now() - start;
  expect(duration).toBeLessThan(120000); // 2 minutes
});
```

**Why this approach**:
- Unit tests catch utility bugs early
- E2E tests verify entire workflow
- Performance tests ensure <2 min execution
- Isolated tests enable parallel execution

**Source**: Testing best practices; Prisma testing docs.

---

## Question 5: Logging & Error Reporting

### Decision: Summary Logging with Optional Verbose Mode

**What we chose**: 

- **Normal mode**: Summary output showing progress (meals created, ingredients seeded, time elapsed)
- **Verbose mode**: Detailed logs for each operation (enabled via environment variable)
- **Errors**: Always logged prominently; script exits with non-zero status

**Implementation approach**:

```typescript
const verbose = process.env.SEED_VERBOSE === 'true';

function log(message: string, level: 'info' | 'error' = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '✗' : '✓';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

function logVerbose(message: string) {
  if (verbose) {
    log(`[VERBOSE] ${message}`, 'info');
  }
}

// Usage:
log('Starting seed...');
for (const meal of meals) {
  logVerbose(`Inserting meal: ${meal.mealName}`);
  try {
    await prisma.meal.create({ data: meal });
    log(`Created meal: ${meal.mealName}`);
  } catch (error) {
    log(`Failed to create meal ${meal.mealName}: ${error.message}`, 'error');
    throw error;
  }
}
```

**Invocation**:
```bash
# Normal run (summary)
npm run db:seed

# Verbose run (detailed logs)
SEED_VERBOSE=true npm run db:seed
```

**Error exit codes**:
- 0: Success
- 1: Seed failure (handled error)
- Unhandled errors exit with non-zero (Node.js default)

**Why this approach**:
- Clean, uncluttered output for normal operation
- Rich debugging info available without default noise
- CI/CD-friendly (exit codes detected by pipelines)
- Developer-friendly (easy to understand progress)

**Source**: CLI best practices; logging standards (12 Factor App).

---

## Summary & Dependencies

| Question | Decision | Implementation Requirement |
|----------|----------|---------------------------|
| Idempotency | Check-and-skip | Query for seed marker; conditional execution |
| UUID Generation | Deterministic (UUID v5 + seed) | Add `uuid` package; deterministicUuid() helper |
| Multi-Tenant Seeding | Independent tenant data | Loop over tenants; respect tenantId in all creates |
| Seed Testing | Integration + E2E tests | Jest test suite; E2E verifies full workflow |
| Logging | Summary + optional verbose | Log helpers; SEED_VERBOSE environment variable |

**No blockers identified**. All patterns are standard, well-documented, and implementable with existing dependencies (Prisma, TypeScript, Node.js).

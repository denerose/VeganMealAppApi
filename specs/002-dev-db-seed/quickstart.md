# Quick Start: Database Seeding

**Date**: February 13, 2026  
**Feature**: Development Database Seed File  
**Audience**: Developers getting started with the Vegan Meal App API

---

## Overview

This guide walks you through seeding your local development database with sample meals, ingredients, and planned weeks. After seeding, you'll have realistic test data to explore the API without manually creating content.

---

## Prerequisites

- **Bun** (or Node.js 16+) installed
- Docker or Podman running (for PostgreSQL)
- Repository cloned and dependencies installed

```bash
git clone <repo-url>
cd VeganMealAppApi
bun install
```

---

## Step 1: Start the Database

If using Docker Compose or Podman Compose:

```bash
docker-compose up -d
# or: podman-compose up -d
```

Verify the database is running:
```bash
docker-compose ps
# or: podman-compose ps
# Should show PostgreSQL container as "running"
```

---

## Step 2: Run Database Migrations

Initialize the schema:

```bash
bun run db:migrate
```

This creates all tables, indexes, and relationships defined in `schema.prisma`.

---

## Step 3: Run the Seed Script

Seed the database with sample data:

```bash
bun run db:seed
```

**Expected output** (summary line):
```
[12:34:56] ✓ Starting seed process...
[12:34:57] ✓ Seeding completed: 20 meals, 30 ingredients, 2 tenants
```

**Success indicator**: Script exits with code 0 (no errors in output). The seed creates 10 meals per tenant (20 total), 15 ingredients per tenant (30 total), 2 tenants, 4 planned weeks (2 per tenant), and 28 day plans (7 per week).

---

## Step 4: Verify Seeded Data

### Option A: Prisma Studio (GUI)

Open an interactive database explorer:

```bash
bun run db:studio
# or: npx prisma studio
```

A browser window opens at `http://localhost:5555`. Browse tables:
- **Meal**: 20 seeded meals (10 per tenant)
- **Ingredient**: 30 vegan ingredients (15 per tenant)
- **UserSettings**: 2 tenant preference records
- **PlannedWeek**: 4 planned weeks (2 per tenant), each with 7 day plans

### Option B: API Calls

Start the API server:

```bash
bun run dev
```

In another terminal, test endpoints:

```bash
# List all meals
curl -X GET http://localhost:3000/api/v1/meals \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected: Array with 10 meals (Creamy Cashew Alfredo, Lentil Bolognese, etc.)

# Get eligible meals for Monday lunch
curl -X GET "http://localhost:3000/api/v1/meals/eligible?date=2026-02-16&mealType=lunch" \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected: Subset of meals matching Monday's lunch preferences

# List planned weeks
curl -X GET http://localhost:3000/api/v1/planned-weeks \
  -H "Authorization: Bearer <your-jwt-token>"

# Expected: 2 weeks starting from next Monday
```

### Option C: Database Query (Raw SQL)

Connect to PostgreSQL directly:

```bash
psql -U <user> -d <database> -h localhost
```

```sql
-- Count seeded data
SELECT COUNT(*) as meal_count FROM "Meal";
SELECT COUNT(*) as ingredient_count FROM "Ingredient";
SELECT COUNT(*) as week_count FROM "PlannedWeek";

-- List all meals
SELECT "id", "mealName", "isDinner", "isLunch" FROM "Meal" LIMIT 10;

-- Check multi-tenant isolation
SELECT "tenantId", COUNT(*) as meal_count 
FROM "Meal" 
GROUP BY "tenantId";
```

---

## Step 5: Explore the Data

### Sample Meal: Creamy Cashew Alfredo Pasta

- **Qualities**: Dinner-suitable, creamy, makes leftovers
- **Ingredients**: Pasta, Cashews, Garlic, Nutritional Yeast
- **Recipe Link**: example.com/recipes/cashew-alfredo
- **Used in**: Week 1 Monday dinner

### Sample Ingredient: Cashews

- **Storage**: PANTRY
- **Staple**: false (used in multiple meals)
- **Meals using it**: Creamy Cashew Alfredo Pasta, Cashew Cream Penne

### Sample Planned Week

- **Per tenant**: 2 planned weeks, each starting from the tenant's configured week start day
- **Coverage**: 7 meal assignments per tenant across 2 weeks (partial coverage; some lunch/dinner slots empty)
- **Mix**: Dinners on some days, lunches on others, some empty slots for testing
- **Testing**: Can assign new meals to empty slots via API

---

## Troubleshooting

### Issue: "Seed data already exists. Skipping."

The database was already seeded. Options:

#### Option A: Reset database
```bash
bun run db:reset  # Drops all data and re-runs migrations
bun run db:seed   # Re-seed
```

#### Option B: Manual cleanup (advanced)
Connect to database and delete:
```sql
DELETE FROM "DayPlan";
DELETE FROM "MealIngredient";
DELETE FROM "PlannedWeek";
DELETE FROM "Meal";
DELETE FROM "Ingredient";
DELETE FROM "UserSettings";
DELETE FROM "Tenant"; -- If applicable
```

### Issue: Migration error

If migrations don't apply:
```bash
bun run db:reset   # Drops DB, re-runs migrations (does not auto-seed)
bun run db:seed    # Re-seed
```

### Issue: Timeout or slow execution

If seed takes >2 minutes:
- Check database connectivity: `docker-compose logs postgres`
- Check system resources (disk space, RAM)
- Enable verbose logging: `SEED_VERBOSE=true bun run db:seed`

### Issue: Authentication error in API calls

You need a valid JWT token. For development, either:
- Use a test token from your authentication service
- Generate a mock token with your auth provider's test credentials
- Check `.env.example` for test token setup

---

## Advanced: Verbose Logging

For detailed seed execution logs:

```bash
SEED_VERBOSE=true bun run db:seed
```

**Output includes**:
- Each ingredient created
- Each meal inserted with ingredient links
- Each day plan assignment
- Timestamps and operation details

Useful for debugging seed failures or understanding execution flow.

---

## Advanced: Custom Seed Data

To modify seed data (e.g., add more meals, change preferences):

1. Edit `prisma/seed-data.ts`
2. Add or modify meal/ingredient definitions
3. **Delete the idempotency marker** (Creamy Cashew Alfredo Pasta) if re-seeding with changes
4. Run seed: `bun run db:seed`

Example: Add a new meal to `SEED_MEALS` in `prisma/seed-data.ts` (see existing entries for the shape: `mealName`, `qualities`, `ingredientNames`, etc.). Re-run seed after resetting or removing the idempotency marker.

---

## Full workflow (migrate → seed → test → verify)

With the database already running, run the full pipeline in one go:

```bash
bun run db:migrate && bun run db:seed && bun run check
```

Optional: open Prisma Studio to inspect data:

```bash
bun run db:studio
```

**Success**: All commands exit 0; tests pass (requires database connection).

---

## Next Steps

- **Explore API**: Test endpoints with seeded data via `curl` or Postman
- **Check Tests**: Run format, lint, and tests: `bun run check`
- **Read Documentation**: See [SEEDING-GUIDE.md](./SEEDING-GUIDE.md) for implementation details
- **Develop Features**: Use seeded data as a stable foundation for new features

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `bun run db:migrate` | Apply pending migrations |
| `bun run db:seed` | Populate database with sample data |
| `bun run db:reset` | Drop database and re-run migrations (then run db:seed to re-seed) |
| `bun run db:studio` | Open Prisma Studio (interactive database browser) |
| `bun run dev` | Start API server (localhost:3000) |
| `bun run check` | Run format, lint, and tests (recommended) |
| `bun test` | Run all tests (including seed integration and E2E) |
| `SEED_VERBOSE=true bun run db:seed` | Seed with detailed logging |

---

## Questions or Issues?

- Check [SEEDING-GUIDE.md](./SEEDING-GUIDE.md) for detailed documentation
- Review [data-model.md](./data-model.md) for data structure details
- Check [research.md](./research.md) for implementation patterns and decisions

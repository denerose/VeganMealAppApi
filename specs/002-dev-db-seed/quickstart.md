# Quick Start: Database Seeding

**Date**: February 13, 2026  
**Feature**: Development Database Seed File  
**Audience**: Developers getting started with the Vegan Meal App API

---

## Overview

This guide walks you through seeding your local development database with sample meals, ingredients, and planned weeks. After seeding, you'll have realistic test data to explore the API without manually creating content.

---

## Prerequisites

- Node.js 16+ installed
- Docker and Docker Compose running (for PostgreSQL)
- Repository cloned and dependencies installed

```bash
git clone <repo-url>
cd VeganMealAppApi
npm install
```

---

## Step 1: Start the Database

If using Docker Compose:

```bash
docker-compose up -d
```

Verify the database is running:
```bash
docker-compose ps
# Should show PostgreSQL container as "running"
```

---

## Step 2: Run Database Migrations

Initialize the schema:

```bash
npm run db:migrate
```

This creates all tables, indexes, and relationships defined in `schema.prisma`.

---

## Step 3: Run the Seed Script

Seed the database with sample data:

```bash
npm run db:seed
```

**Expected output**:
```
[2026-02-13T10:30:45Z] ✓ Checking for existing seed data...
[2026-02-13T10:30:45Z] ✓ Creating tenant settings...
[2026-02-13T10:30:45Z] ✓ Created 15 ingredients
[2026-02-13T10:30:45Z] ✓ Created 10 meals
[2026-02-13T10:30:45Z] ✓ Created 2 planned weeks (14 day plans)
[2026-02-13T10:30:47Z] ✓ Seed completed in 2.1 seconds
```

**Success indicator**: Script exits with code 0 (no errors in output).

---

## Step 4: Verify Seeded Data

### Option A: Prisma Studio (GUI)

Open an interactive database explorer:

```bash
npx prisma studio
```

A browser window opens at `http://localhost:5555`. Browse tables:
- **Meals**: Click to see all 10 seeded meals
- **Ingredients**: View 15 vegan ingredients
- **UserSettings**: Check tenant preferences
- **PlannedWeeks**: See 2+ weeks with day plans

### Option B: API Calls

Start the API server:

```bash
npm run dev
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

- **Week 1**: Starts next Monday
- **Coverage**: 7 meals across 14 day-slots (50% coverage)
- **Mix**: Dinners on some days, lunches on others, some empty days for testing
- **Testing**: Can assign new meals to empty slots via API

---

## Troubleshooting

### Issue: "Seed data already exists. Skipping."

The database was already seeded. Options:

#### Option A: Reset database
```bash
npm run db:reset  # Drops all data and re-runs migrations
npm run db:seed   # Re-seed
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
npm run db:migrate:reset  # Reset AND re-run migrations
npm run db:seed
```

### Issue: Timeout or slow execution

If seed takes >2 minutes:
- Check database connectivity: `docker-compose logs postgres`
- Check system resources (disk space, RAM)
- Enable verbose logging: `SEED_VERBOSE=true npm run db:seed`

### Issue: Authentication error in API calls

You need a valid JWT token. For development, either:
- Use a test token from your authentication service
- Generate a mock token with your auth provider's test credentials
- Check `.env.example` for test token setup

---

## Advanced: Verbose Logging

For detailed seed execution logs:

```bash
SEED_VERBOSE=true npm run db:seed
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
4. Run seed: `npm run db:seed`

Example: Add a new meal
```typescript
// In prisma/seed-data.ts
export const seedMeals = (tenantId: UUID) => [
  // ... existing meals ...
  {
    id: UUID(),
    mealName: "My New Vegan Meal",
    qualities: { isDinner: true, isLunch: false, ... },
    ingredients: [ /* ingredient IDs */ ],
  },
];
```

---

## Next Steps

- **Explore API**: Test endpoints with seeded data via `curl` or Postman
- **Check Tests**: Run integration tests: `npm test`
- **Read Documentation**: See [SEEDING-GUIDE.md](./SEEDING-GUIDE.md) for implementation details
- **Develop Features**: Use seeded data as a stable foundation for new features

---

## Quick Commands Reference

| Command | Purpose |
|---------|---------|
| `npm run db:migrate` | Apply pending migrations |
| `npm run db:seed` | Populate database with sample data |
| `npm run db:reset` | Drop database, re-run migrations, re-seed |
| `npx prisma studio` | Open interactive database browser (GUI) |
| `npm run dev` | Start API server (localhost:3000) |
| `npm test` | Run all tests including seed E2E |
| `SEED_VERBOSE=true npm run db:seed` | Seed with detailed logging |

---

## Questions or Issues?

- Check [SEEDING-GUIDE.md](./SEEDING-GUIDE.md) for detailed documentation
- Review [data-model.md](./data-model.md) for data structure details
- Check [research.md](./research.md) for implementation patterns and decisions

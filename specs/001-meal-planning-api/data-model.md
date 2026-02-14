# Data Model Design

**Feature**: Vegan Meal Planning API  
**Created**: 30 December 2025  
**Database**: PostgreSQL 16  
**ORM**: Prisma 5.x

## Overview

This document defines the complete database schema for the Vegan Meal Planning API using Prisma Schema Language. The design implements:

- **Multi-tenancy**: Row-level isolation with `tenantId` on all tenant-scoped models
- **Soft deletes**: `deletedAt` timestamp for archival instead of hard deletes
- **Audit trail**: `createdAt`, `updatedAt`, `createdBy` tracking
- **Type safety**: Enums for constrained values
- **Performance**: Strategic indexes on foreign keys and query patterns

---

## Prisma Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// TENANT & USER MANAGEMENT
// ============================================================================

model Tenant {
  id            String        @id @default(uuid())
  name          String
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  // Relations
  users         User[]
  userSettings  UserSettings?
  meals         Meal[]
  ingredients   Ingredient[]
  plannedWeeks  PlannedWeek[]
  
  @@map("tenants")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  nickname      String
  isTenantAdmin Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Tenant relationship
  tenantId      String
  tenant        Tenant    @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Relations (audit trail)
  createdMeals  Meal[]    @relation("MealCreator")
  
  @@index([tenantId])
  @@index([email])
  @@map("users")
}

model UserSettings {
  id                String        @id @default(uuid())
  weekStartDay      WeekStartDay  @default(MONDAY)
  dailyPreferences  Json          // Array of { day: DayOfWeek, preferences: QualityPreferences }
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  
  // One-to-one with Tenant
  tenantId          String        @unique
  tenant            Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  @@map("user_settings")
}

enum WeekStartDay {
  MONDAY
  SATURDAY
  SUNDAY
}

// ============================================================================
// MEAL PLANNING
// ============================================================================

model PlannedWeek {
  id            String      @id @default(uuid())
  startingDate  DateTime    @db.Date  // Date-only (no time component)
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  
  // Tenant scoping
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Relations
  dayPlans      DayPlan[]
  
  @@index([tenantId])
  @@index([tenantId, startingDate])
  @@map("planned_weeks")
}

model DayPlan {
  id              String      @id @default(uuid())
  date            DateTime    @db.Date  // Date-only
  longDay         DayOfWeek   // Calculated: Monday, Tuesday, etc.
  shortDay        ShortDay    // Calculated: Mon, Tue, etc.
  isLeftover      Boolean     @default(false)  // True if lunch is a leftover from previous dinner
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  // Relations
  plannedWeekId   String
  plannedWeek     PlannedWeek @relation(fields: [plannedWeekId], references: [id], onDelete: Cascade)
  
  // Meal assignments (both optional)
  lunchMealId     String?
  lunchMeal       Meal?       @relation("LunchMeals", fields: [lunchMealId], references: [id], onDelete: SetNull)
  
  dinnerMealId    String?
  dinnerMeal      Meal?       @relation("DinnerMeals", fields: [dinnerMealId], references: [id], onDelete: SetNull)
  
  @@index([plannedWeekId])
  @@index([date])
  @@map("day_plans")
}

enum DayOfWeek {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}

enum ShortDay {
  MON
  TUE
  WED
  THU
  FRI
  SAT
  SUN
}

// ============================================================================
// MEAL LIBRARY
// ============================================================================

model Meal {
  id            String      @id @default(uuid())
  mealName      String
  recipeLink    String?     // Optional URL or string
  mealImageId   String?     // External CDN image identifier
  isArchived    Boolean     @default(false)  // Soft delete flag
  createdAt     DateTime    @default(now())
  updatedAt     DateTime    @updatedAt
  deletedAt     DateTime?   // Timestamp when archived
  
  // Tenant scoping
  tenantId      String
  tenant        Tenant      @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Creator tracking
  createdBy     String
  creator       User        @relation("MealCreator", fields: [createdBy], references: [id], onDelete: Restrict)
  
  // Relations
  qualities     MealQualities?
  ingredients   MealIngredient[]  // Many-to-many junction
  
  // DayPlan references (meals can be used in multiple day plans)
  lunchPlans    DayPlan[]   @relation("LunchMeals")
  dinnerPlans   DayPlan[]   @relation("DinnerMeals")
  
  @@index([tenantId])
  @@index([tenantId, isArchived])  // Filter active meals
  @@index([createdBy])
  @@map("meals")
}

model MealQualities {
  id            String   @id @default(uuid())
  isDinner      Boolean  @default(true)
  isLunch       Boolean  @default(false)
  isCreamy      Boolean  @default(false)
  isAcidic      Boolean  @default(false)
  greenVeg      Boolean  @default(false)
  makesLunch    Boolean  @default(false)
  isEasyToMake  Boolean  @default(false)
  needsPrep     Boolean  @default(false)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  // One-to-one with Meal
  mealId        String   @unique
  meal          Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)
  
  @@map("meal_qualities")
}

// ============================================================================
// INGREDIENTS
// ============================================================================

model Ingredient {
  id            String         @id @default(uuid())
  ingredientName String
  staple        Boolean        @default(false)
  storageType   StorageType
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  
  // Tenant scoping
  tenantId      String
  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  
  // Relations
  meals         MealIngredient[]  // Many-to-many junction
  
  @@unique([tenantId, ingredientName])  // No duplicate ingredient names per tenant
  @@index([tenantId])
  @@map("ingredients")
}

enum StorageType {
  FRIDGE
  PANTRY
  FROZEN
  OTHER
}

// Many-to-many junction table
model MealIngredient {
  id           String     @id @default(uuid())
  createdAt    DateTime   @default(now())
  
  mealId       String
  meal         Meal       @relation(fields: [mealId], references: [id], onDelete: Cascade)
  
  ingredientId String
  ingredient   Ingredient @relation(fields: [ingredientId], references: [id], onDelete: Cascade)
  
  @@unique([mealId, ingredientId])  // No duplicate ingredient per meal
  @@index([mealId])
  @@index([ingredientId])
  @@map("meal_ingredients")
}
```

---

## Entity Descriptions

### Tenant
**Purpose**: Represents an organization or household using the system.

**Fields**:
- `id`: Unique identifier (UUID)
- `name`: Tenant display name (e.g., "Smith Family", "Vegan Foodies Co.")
- Audit: `createdAt`, `updatedAt`

**Relationships**:
- One-to-many: Users (all users belong to one tenant)
- One-to-one: UserSettings (shared configuration)
- One-to-many: Meals, Ingredients, PlannedWeeks (tenant-scoped data)

**Isolation Strategy**: All tenant-scoped models have `tenantId` foreign key; queries MUST filter by tenant.

---

### User
**Purpose**: Represents a person using the system.

**Fields**:
- `id`: Unique identifier (UUID, unique across all tenants)
- `email`: Unique email address
- `nickname`: Display name
- `isTenantAdmin`: Permission flag (controls UserSettings modification)
- `tenantId`: Foreign key to Tenant
- Audit: `createdAt`, `updatedAt`

**Relationships**:
- Many-to-one: Tenant (each user belongs to exactly one tenant)
- One-to-many: Meals (as creator)

**Constraints**:
- Email must be unique globally
- At least one user per tenant should be admin (enforced at application level)

---

### UserSettings
**Purpose**: Tenant-level configuration for meal planning preferences.

**Fields**:
- `id`: Unique identifier (UUID)
- `weekStartDay`: Enum (MONDAY, SATURDAY, SUNDAY) - default MONDAY
- `dailyPreferences`: JSONB column storing array of 7 day preferences
- `tenantId`: Foreign key to Tenant (unique - one settings per tenant)
- Audit: `createdAt`, `updatedAt`

**Daily Preferences Structure** (JSON):
```typescript
type DailyPreferences = {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  preferences: {
    isCreamy?: boolean;
    isAcidic?: boolean;
    greenVeg?: boolean;
    isEasyToMake?: boolean;
    needsPrep?: boolean;
  };
}[];

// Example:
[
  {
    "day": "Monday",
    "preferences": { "isEasyToMake": true }
  },
  {
    "day": "Tuesday",
    "preferences": { "greenVeg": true, "needsPrep": false }
  },
  // ... 5 more days
]
```

**Validation** (application level):
- Must have exactly 7 day entries
- Each day of week appears exactly once
- Preferences match MealQualities boolean flags

---

### PlannedWeek
**Purpose**: Represents a 7-day meal plan.

**Fields**:
- `id`: Unique identifier (UUID)
- `startingDate`: DATE type (no time component) - must align with UserSettings.weekStartDay
- `tenantId`: Foreign key to Tenant
- Audit: `createdAt`, `updatedAt`

**Relationships**:
- Many-to-one: Tenant
- One-to-many: DayPlans (exactly 7, enforced at application level)

**Business Rules** (application enforced):
- `startingDate` day-of-week must match tenant's `weekStartDay`
- Must have exactly 7 consecutive DayPlans
- Dates must be consecutive (startingDate, startingDate+1, ..., startingDate+6)

---

### DayPlan
**Purpose**: Represents meal planning for a single day.

**Fields**:
- `id`: Unique identifier (UUID)
- `date`: DATE type (specific calendar date)
- `longDay`: Enum DayOfWeek (Monday, Tuesday, etc.) - calculated from `date`
- `shortDay`: Enum ShortDay (Mon, Tue, etc.) - calculated from `date`
- `isLeftover`: Boolean flag indicating if lunch is auto-populated from previous dinner
- `lunchMealId`, `dinnerMealId`: Optional foreign keys to Meal
- `plannedWeekId`: Foreign key to PlannedWeek
- Audit: `createdAt`, `updatedAt`

**Relationships**:
- Many-to-one: PlannedWeek
- Many-to-one: Meal (for lunch, optional)
- Many-to-one: Meal (for dinner, optional)

**Business Rules** (application enforced):
- `longDay` and `shortDay` derived from `date` using date-fns `getDay()`
- `isLeftover = true` when lunch is auto-populated from previous day's dinner
- First day of week: `isLeftover` must be false (no cross-week logic)
- If dinner meal has `makesLunch = true` and next day's lunch is null, auto-populate

**On Delete Behavior**:
- If Meal is deleted (soft): `onDelete: SetNull` - lunch/dinner slots become null
- Archived meals remain visible in historical plans

---

### Meal
**Purpose**: Represents a vegan meal in the tenant's library.

**Fields**:
- `id`: Unique identifier (UUID)
- `mealName`: Display name (e.g., "Lentil Curry", "Tofu Scramble")
- `recipeLink`: Optional URL or string
- `mealImageId`: Optional external CDN image identifier
- `isArchived`: Soft delete flag (default false)
- `deletedAt`: Timestamp when archived (nullable)
- `tenantId`: Foreign key to Tenant
- `createdBy`: Foreign key to User (creator)
- Audit: `createdAt`, `updatedAt`

**Relationships**:
- Many-to-one: Tenant
- Many-to-one: User (creator)
- One-to-one: MealQualities
- Many-to-many: Ingredients (via MealIngredient junction)
- One-to-many: DayPlan (as lunch or dinner)

**Soft Delete Strategy**:
- Instead of hard delete, set `isArchived = true` and `deletedAt = now()`
- Archived meals:
  - Do NOT appear in active meal library
  - Do NOT appear in eligible meals lists
  - DO appear in existing planned weeks (with archived indicator)
  - CANNOT be assigned to new day plans

**Indexes**:
- `tenantId` (for filtering)
- `(tenantId, isArchived)` (composite for active meal queries)
- `createdBy` (for creator lookups)

---

### MealQualities
**Purpose**: Characteristics of a meal used for filtering and eligibility.

**Fields** (all boolean, defaults false except `isDinner`):
- `isDinner`: true by default
- `isLunch`: false by default
- `isCreamy`: false
- `isAcidic`: false (mutually exclusive with `isCreamy`)
- `greenVeg`: false
- `makesLunch`: false (indicates meal produces leftovers)
- `isEasyToMake`: false
- `needsPrep`: false
- `mealId`: Foreign key to Meal (unique, one-to-one)
- Audit: `createdAt`, `updatedAt`

**Relationships**:
- One-to-one: Meal

**Business Rules** (application enforced):
- If `isCreamy = true`, then `isAcidic` MUST be false
- If `isAcidic = true`, then `isCreamy` MUST be false
- At least one of `isDinner` or `isLunch` should be true (optional guideline)

**Eligible Meal Matching**:
```typescript
// Meal is eligible if:
// 1. isLunch=true (for lunch slot) OR isDinner=true (for dinner slot)
// 2. ALL quality flags in day's preferences are also true in meal qualities (AND logic)

function isEligible(
  mealQualities: MealQualities,
  dayPreferences: QualityPreferences,
  isLunchSlot: boolean
): boolean {
  // Check meal type
  const correctMealType = isLunchSlot ? mealQualities.isLunch : mealQualities.isDinner;
  if (!correctMealType) return false;
  
  // Check all preference flags match
  return Object.entries(dayPreferences).every(([key, value]) => {
    if (!value) return true; // Preference not set, don't filter
    return mealQualities[key] === value;
  });
}
```

---

### Ingredient
**Purpose**: Key ingredient used in meals.

**Fields**:
- `id`: Unique identifier (UUID)
- `ingredientName`: Display name (e.g., "Tofu", "Lentils", "Cashews")
- `staple`: Boolean flag (pantry staple vs specialty ingredient)
- `storageType`: Enum (FRIDGE, PANTRY, FROZEN, OTHER)
- `tenantId`: Foreign key to Tenant
- Audit: `createdAt`, `updatedAt`

**Relationships**:
- Many-to-one: Tenant
- Many-to-many: Meals (via MealIngredient junction)

**Constraints**:
- Unique `(tenantId, ingredientName)` - no duplicate names per tenant
- Ingredients are tenant-scoped (each tenant maintains their own ingredient list)

**Vegan Constraint** (application enforced):
- All ingredients MUST be plant-based (no meat, dairy, eggs, honey, animal products)
- Validation at creation time

---

### MealIngredient (Junction Table)
**Purpose**: Many-to-many relationship between Meals and Ingredients.

**Fields**:
- `id`: Unique identifier (UUID)
- `mealId`: Foreign key to Meal
- `ingredientId`: Foreign key to Ingredient
- Audit: `createdAt`

**Constraints**:
- Unique `(mealId, ingredientId)` - no duplicate ingredients per meal

**On Delete**:
- Cascade: if Meal or Ingredient is deleted, junction records are removed

---

## Indexes Strategy

### Query Patterns & Index Justification

1. **Tenant Filtering** (most common query pattern)
   - Every tenant-scoped query filters by `tenantId`
   - Index: `@index([tenantId])` on Meal, Ingredient, PlannedWeek, User

2. **Active Meals Lookup**
   - Frequent query: "Get all active (non-archived) meals for tenant"
   - Composite index: `@index([tenantId, isArchived])`

3. **Planned Week Date Range**
   - Query: "Get planned week for tenant starting on specific date"
   - Composite index: `@index([tenantId, startingDate])`

4. **Day Plan Date Lookup**
   - Query: "Get day plans for specific date range"
   - Index: `@index([date])`

5. **Email Lookup** (authentication)
   - Query: "Find user by email"
   - Index: `@index([email])` + `@unique` constraint

6. **Many-to-Many Joins**
   - MealIngredient: indexes on both `mealId` and `ingredientId` for efficient joins

---

## Migration Strategy

### Initial Migration
1. Run `npx prisma migrate dev --name init` to create initial schema
2. Seed script will create:
   - Default tenant
   - Admin user for that tenant
   - Default UserSettings (Monday start, all preferences empty)
   - Sample vegan meals and ingredients

### Subsequent Migrations
- Use `npx prisma migrate dev --name <description>` for schema changes
- Always review generated SQL before applying
- Test migrations against seed data

### Production Migrations
- Use `npx prisma migrate deploy` (no prompts, safe for CI/CD)
- Run in maintenance window if adding non-nullable columns
- Use `prisma migrate reset` only in development (destroys data)

---

## Data Validation Rules

### Application-Level Constraints

**Tenant**:
- Must have at least one user with `isTenantAdmin = true`

**UserSettings**:
- `dailyPreferences` JSON must have exactly 7 entries
- Each day of week (Monday-Sunday) must appear exactly once
- Preference flags must match MealQualities boolean field names

**PlannedWeek**:
- `startingDate` day-of-week must match tenant's `weekStartDay`
- Must have exactly 7 DayPlans
- DayPlan dates must be consecutive

**DayPlan**:
- `longDay` and `shortDay` must match `date` day-of-week
- `isLeftover` only true when lunch is auto-populated
- First day of week: `isLeftover` must be false

**Meal**:
- If `isArchived = true`, then `deletedAt` must be set
- If `isArchived = false`, then `deletedAt` must be null

**MealQualities**:
- `isCreamy` and `isAcidic` are mutually exclusive (both cannot be true)
- At least one of `isDinner` or `isLunch` should be true

**Ingredient**:
- `ingredientName` must be vegan (plant-based only)
- No empty strings

---

## Sample Data Structure

### Example: Complete Meal with Relations

```json
{
  "id": "uuid-1",
  "mealName": "Creamy Cashew Alfredo Pasta",
  "recipeLink": "https://example.com/recipes/cashew-alfredo",
  "mealImageId": "cdn-image-123",
  "isArchived": false,
  "deletedAt": null,
  "tenantId": "tenant-1",
  "createdBy": "user-1",
  "createdAt": "2025-12-30T10:00:00Z",
  "updatedAt": "2025-12-30T10:00:00Z",
  "qualities": {
    "id": "uuid-2",
    "isDinner": true,
    "isLunch": false,
    "isCreamy": true,
    "isAcidic": false,
    "greenVeg": false,
    "makesLunch": true,
    "isEasyToMake": false,
    "needsPrep": true
  },
  "ingredients": [
    {
      "id": "uuid-3",
      "ingredientName": "Cashews",
      "staple": false,
      "storageType": "PANTRY"
    },
    {
      "id": "uuid-4",
      "ingredientName": "Pasta",
      "staple": true,
      "storageType": "PANTRY"
    },
    {
      "id": "uuid-5",
      "ingredientName": "Nutritional Yeast",
      "staple": true,
      "storageType": "PANTRY"
    }
  ]
}
```

---

## Performance Considerations

1. **Tenant Isolation Performance**
   - All queries include `WHERE tenantId = ?` via indexes
   - Expected tenant library size: <200 meals (per spec SC-004)
   - Performance target: <500ms for eligible meal filtering

2. **Soft Delete Performance**
   - Index on `(tenantId, isArchived)` ensures fast active meal queries
   - Archived meals excluded via `WHERE isArchived = false`

3. **Many-to-Many Queries**
   - MealIngredient junction table indexed on both foreign keys
   - Use Prisma `include: { ingredients: true }` for eager loading
   - Avoid N+1 queries

4. **Date Queries**
   - PostgreSQL DATE type optimized for date-only comparisons
   - Index on `date` field for range queries on DayPlans

---

## Next Steps

1. Create Prisma schema file at `prisma/schema.prisma`
2. Create seed script at `prisma/seed.ts` with vegan sample data
3. Generate initial migration: `npx prisma migrate dev --name init`
4. Generate Prisma Client: `npx prisma generate`

---

**Data Model Completed**: 30 December 2025  
**Status**: ✅ Ready for implementation

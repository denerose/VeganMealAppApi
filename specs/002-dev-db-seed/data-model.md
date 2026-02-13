# Seed Data Model

**Date**: February 13, 2026  
**Feature**: Development Database Seed File  
**Purpose**: Define the concrete seed data structure, entity relationships, and generation strategy

---

## Overview

The seed populates 7 core entities across 2 test tenants:

1. **Tenants & User Settings**: 2 tenants with distinct weekStartDay preferences
2. **Ingredients**: 15 vegan ingredients distributed across storage types
3. **Meals**: 10 vegan meals with diverse qualities; linked to ingredients
4. **Meal Qualities**: Quality flags for each meal (isDinner, isLunch, isCreamy, etc.)
5. **Planned Weeks**: 2 weeks per tenant (14 days total); ~50% meal coverage
6. **Day Plans**: 14 day plans per tenant; linked to meals
7. **Daily Preferences**: 7-day quality preferences per tenant for meal filtering

---

## Data Entities & Specifications

### 1. Tenants (2 instances)

| Field | Type | Seed Value 1 | Seed Value 2 | Notes |
|-------|------|--------------|--------------|-------|
| id | UUID | deterministicUuid('Tenant-1') | deterministicUuid('Tenant-2') | Hash-derived for reproducibility |
| name | string | "Test Tenant 1" | "Test Tenant 2" | For reference only |

### 2. User Settings (Per Tenant)

| Field | Type | Seed Tenant 1 | Seed Tenant 2 | Notes |
|-------|------|-----------------|-----------------|-------|
| id | UUID | deterministicUuid('settings:Tenant-1') | deterministicUuid('settings:Tenant-2') | Unique per tenant |
| tenantId | UUID | Tenant-1 ID | Tenant-2 ID | Foreign key to tenant |
| weekStartDay | enum | MONDAY | SUNDAY | T1 starts Mon; T2 starts Sun |
| dailyPreferences | array | See Daily Preferences | See Daily Preferences | 7 days × quality preferences |
| createdAt | timestamp | NOW | NOW | Seed timestamp |
| updatedAt | timestamp | NOW | NOW | Seed timestamp |

**Daily Preferences (T1: MONDAY weekStartDay)**:
- MONDAY: creamy=false, acidic=false, greenVeg=true, easyToMake=false, needsPrep=true
- TUESDAY: creamy=false, acidic=false, greenVeg=true, easyToMake=true, needsPrep=false
- WEDNESDAY: creamy=true, acidic=false, greenVeg=false, easyToMake=false, needsPrep=false
- THURSDAY: creamy=false, acidic=true, greenVeg=true, easyToMake=true, needsPrep=false
- FRIDAY: creamy=true, acidic=false, greenVeg=false, easyToMake=true, needsPrep=false
- SATURDAY: creamy=false, acidic=false, greenVeg=true, easyToMake=false, needsPrep=true
- SUNDAY: creamy=true, acidic=false, greenVeg=true, easyToMake=false, needsPrep=false

**Daily Preferences (T2: SUNDAY weekStartDay)**: Similar pattern, offset by 1 day (realistic variety).

---

### 3. Ingredients (15 vegan items, distributed across storage types)

**Storage Type Distribution**:
- FRIDGE (4): Tofu, Tempeh, Coconut Milk, Fresh Basil
- PANTRY (6): Pasta, Cashews, Chickpeas, Lentils, Nutritional Yeast, Garlic
- FROZEN (3): Frozen Broccoli, Frozen Peas, Frozen Spinach
- OTHER (2): Olive Oil, Soy Sauce

| id | name | staple | storage | tenantId | createdAt | updatedAt |
|----|------|--------|---------|----------|-----------|-----------|
| `<UUID>` | Tofu | true | FRIDGE | Tenant-1 | NOW | NOW |
| `<UUID>` | Tempeh | false | FRIDGE | Tenant-1 | NOW | NOW |
| `<UUID>` | Coconut Milk | true | FRIDGE | Tenant-1 | NOW | NOW |
| `<UUID>` | Fresh Basil | false | FRIDGE | Tenant-1 | NOW | NOW |
| `<UUID>` | Pasta | true | PANTRY | Tenant-1 | NOW | NOW |
| `<UUID>` | Cashews | false | PANTRY | Tenant-1 | NOW | NOW |
| `<UUID>` | Chickpeas | true | PANTRY | Tenant-1 | NOW | NOW |
| `<UUID>` | Lentils | true | PANTRY | Tenant-1 | NOW | NOW |
| `<UUID>` | Nutritional Yeast | false | PANTRY | Tenant-1 | NOW | NOW |
| `<UUID>` | Garlic | true | PANTRY | Tenant-1 | NOW | NOW |
| `<UUID>` | Frozen Broccoli | false | FROZEN | Tenant-1 | NOW | NOW |
| `<UUID>` | Frozen Peas | false | FROZEN | Tenant-1 | NOW | NOW |
| `<UUID>` | Frozen Spinach | false | FROZEN | Tenant-1 | NOW | NOW |
| `<UUID>` | Olive Oil | true | OTHER | Tenant-1 | NOW | NOW |
| `<UUID>` | Soy Sauce | true | OTHER | Tenant-1 | NOW | NOW |

**Tenant-2 ingredients**: Same 15, with Tenant-2 ID. This enables testing that Tenant-2 doesn't see Tenant-1 ingredients.

---

### 4. Meals (10 vegan meals per tenant)

**Meal Quality Distribution**: Coverage across all 9 meal qualities:
- isDinner: 8 meals (most dinners)
- isLunch: 3 meals (subset suitable for lunch)
- isCreamy: 4 meals (cashew-based, coconut-based)
- isAcidic: 2 meals (tomato-based)
- greenVeg: 5 meals (broccoli, spinach, basil)
- makesLunch: 3 meals (produce leftovers)
- isEasyToMake: 4 meals (few steps, short prep)
- needsPrep: 5 meals (chopping, marinating)

| # | mealName | isDinner | isLunch | isCreamy | isAcidic | greenVeg | makesLunch | isEasyToMake | needsPrep | Ingredients | recipeLink |
|---|----------|----------|---------|----------|----------|----------|------------|--------------|-----------|-------------|------------|
| 1 | Creamy Cashew Alfredo Pasta | T | F | T | F | F | T | F | T | Pasta, Cashews, Garlic | example.com/recipes/cashew-alfredo |
| 2 | Lentil Bolognese | T | F | F | T | F | T | F | T | Lentils, Garlic, Olive Oil | example.com/recipes/lentil-bolognese |
| 3 | Crispy Tofu Stir-Fry with Broccoli | T | T | F | F | T | F | F | T | Tofu, Frozen Broccoli, Soy Sauce | example.com/recipes/tofu-stir-fry |
| 4 | Coconut Curry with Chickpeas | T | T | T | F | T | F | T | T | Chickpeas, Coconut Milk, Garlic | example.com/recipes/coconut-curry |
| 5 | Pasta Primavera | T | F | F | F | T | F | T | F | Pasta, Fresh Basil, Olive Oil | example.com/recipes/pasta-primavera |
| 6 | Tempeh Tacos with Avocado | T | T | F | F | F | F | T | F | Tempeh, Garlic, Olive Oil | example.com/recipes/tempeh-tacos |
| 7 | Creamy Spinach & Lentil Soup | T | F | T | F | T | F | T | T | Lentils, Frozen Spinach, Coconut Milk | example.com/recipes/spinach-soup |
| 8 | Tomato & Bean Chili | T | F | F | T | T | T | F | T | Chickpeas, Lentils, Garlic | example.com/recipes/bean-chili |
| 9 | Cashew Cream Penne | T | F | T | F | T | T | T | T | Pasta, Cashews, Frozen Peas | example.com/recipes/cashew-penne |
| 10 | Spicy Tofu & Vegetable Rice Bowl | T | T | F | F | T | F | T | T | Tofu, Frozen Broccoli, Soy Sauce | example.com/recipes/tofu-rice |

**Data Format**:
```typescript
{
  id: UUID,
  mealName: string,
  recipeLink: string | null,
  mealImageId: string | null, // Placeholder: "meal-image-1", "meal-image-2", etc.
  isArchived: false,
  qualities: { ... },
  ingredients: [ ... ],
  createdBy: deterministicUuid('system:seed-user'),
  tenantId: Tenant-1 ID (or Tenant-2 ID),
  createdAt: NOW,
  updatedAt: NOW,
  deletedAt: null,
}
```

**Tenant-2 meals**: Same 10 meals, with Tenant-2 ID and ingredients, ensuring isolation.

---

### 5. Planned Weeks (2 per tenant)

**Week 1**: Starts from "next Monday" (relative to seed execution date)
**Week 2**: Starts 7 days after Week 1

**Formula for "next Monday"**:
```typescript
const today = new Date();
const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
const nextMonday = new Date(today);
nextMonday.setDate(today.getDate() + daysUntilMonday);
```

| Field | Week 1 | Week 2 | Notes |
|-------|--------|--------|-------|
| id | UUID | UUID | |
| startingDate | next Monday | next Monday + 7 days | Date only (YYYY-MM-DD) |
| tenantId | Tenant-1 | Tenant-1 | Per-tenant weeks |
| createdAt | NOW | NOW | |
| updatedAt | NOW | NOW | |

**Day Plans per Week**: 7 (MON-SUN or SUN-SAT depending on weekStartDay)

---

### 6. Day Plans (7 per week × 2 weeks = 14 per tenant)

**Meal Coverage**: ~50% coverage = 7 meals across 14 day-slots

**Assignment Strategy (Tenant-1, week 1)**:
- Monday Dinner: Meal 1 (Creamy Cashew Alfredo Pasta)
- Monday Lunch: null
- Tuesday Dinner: Meal 2 (Lentil Bolognese)
- Tuesday Lunch: null
- Wednesday Dinner: null
- Wednesday Lunch: Meal 3 (Crispy Tofu Stir-Fry) [lunch-suitable]
- Thursday Dinner: Meal 4 (Coconut Curry)
- Thursday Lunch: null
- Friday Dinner: null
- Friday Lunch: Meal 5 (Pasta Primavera) [lunch-suitable]
- Saturday Dinner: Meal 6 (Tempeh Tacos)
- Saturday Lunch: null
- Sunday Dinner: Meal 7 (Creamy Spinach Soup)
- Sunday Lunch: null

**Week 2**: Rotate meals (Meal 8, 9, 10, 1, etc.) to add variety for pagination testing.

| Field | Type | Example Value | Notes |
|-------|------|----------------|-------|
| id | UUID | `<UUID>` | Unique per day |
| date | date | 2026-02-16 (example Monday) | YYYY-MM-DD format |
| longDay | enum | MONDAY | Day name |
| shortDay | enum | MON | 3-letter abbreviation |
| isLeftover | boolean | false | Not auto-populated for seed |
| lunchMealId | UUID | null or Meal ID | Null for most days |
| dinnerMealId | UUID | Meal ID or null | ~50% populated |
| plannedWeekId | UUID | Week 1 ID | Foreign key |
| createdAt | timestamp | NOW | |
| updatedAt | timestamp | NOW | |

**Leftover Testing**: `isLeftover` is false for all seeded assignments (full leftover chains tested via API). However, seed includes sufficient dinner assignments to enable leftover population testing via API calls.

---

## Idempotency Strategy

**Marker Meal**: "Creamy Cashew Alfredo Pasta" is checked as the idempotency marker.

**Check Logic**:
```typescript
const seedMarkerMeal = await prisma.meal.findFirst({
  where: {
    mealName: "Creamy Cashew Alfredo Pasta",
    tenantId: tenant1Id,
  },
});

if (seedMarkerMeal) {
  console.log("Seed data already exists. Skipping.");
  return;
}
```

**Why this meal**: It's the first created, vegan-aligned, and unlikely to be user-created manually.

---

## Relationships & Constraints

### Many-to-Many: Meal ↔ Ingredient

**Join Table**: `MealIngredient` (Prisma implicit)

**Sample Links (Meal 1: Cashew Alfredo)**:
- Meal ID → Pasta ID
- Meal ID → Cashews ID
- Meal ID → Garlic ID
- Meal ID → Nutritional Yeast ID

**Coverage**: At least 5 meals have 5+ ingredients each (requirement FR-006).

### One-to-Many: Tenant → Meals, Ingredients, UserSettings, PlannedWeeks

All entities scoped to `tenantId`. Enables multi-tenant isolation testing.

### One-to-Many: PlannedWeek → DayPlans

Each week has exactly 7 day plans. No deletion or gaps.

### One-to-Many: DayPlan → Meals

Optional foreign keys: `lunchMealId`, `dinnerMealId` (both nullable).

---

## Data Validation Rules

All seeded data MUST:

1. **Referential Integrity**: All foreign keys exist (ingredients before meals, tenants before settings)
2. **Uniqueness**: No duplicate meal names per tenant, no duplicate ingredient names per tenant
3. **Vegan Compliance**: All meals and ingredients are 100% plant-based
4. **Quality Consistency**: Meals with `isLunch: true` are assigned to lunch slots; `isDinner: true` for dinner
5. **Date Validity**: Week start dates align with tenant's `weekStartDay` setting
6. **Timestamp Validity**: `createdAt` ≤ `updatedAt`; both in ISO 8601 format

---

## Performance & Size Metrics

| Entity | Count | Notes |
|--------|-------|-------|
| Tenants | 2 | |
| User Settings | 2 | One per tenant |
| Daily Preferences | 14 | 7 days × 2 tenants |
| Ingredients | 30 | 15 per tenant |
| Meals | 20 | 10 per tenant |
| Meal Qualities | 20 | One per meal |
| Meal-Ingredient Links | ~110 | ~5-6 per meal on average |
| Planned Weeks | 4 | 2 per tenant |
| Day Plans | 28 | 7 per week × 4 weeks |
| Total Records | ~239 | Minimal; fast seed execution |

**Expected Seed Duration**: <2 minutes (including setup, validation, logging)

---

## File Organization

Seed data will be organized as follows:

**prisma/seed-data.ts**:
```typescript
export const seedTenants = [ /* 2 tenant configs */ ];
export const seedIngredients = (tenantId: UUID) => [ /* 15 ingredients */ ];
export const seedMeals = (tenantId: UUID) => [ /* 10 meals with qualities */ ];
export const seedUserSettings = (tenantId: UUID) => { /* settings with daily prefs */ };
export const seedPlannedWeeks = (tenantId: UUID) => [ /* 2 weeks */ ];
export const seedDayPlans = (weekId: UUID, meals: Meal[]) => [ /* 7 day plans */ ];
```

This modular structure enables:
- Easy testing of individual seed functions
- Clear separation of concerns
- Reusability across tests
- Simple augmentation for additional test scenarios

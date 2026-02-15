# Data Model: Web Frontend (005-web-frontend)

**Feature**: 005-web-frontend  
**Date**: 2026-02-15

## Scope

The frontend does not define its own persistence; it consumes the existing REST API. This document describes the **client-side view models and store state** that mirror API entities and support the UI. Types and shapes align with the OpenAPI schemas in `specs/001-meal-planning-api/contracts/openapi.yaml` and `specs/003-user-auth/contracts/openapi.yaml`.

## Auth (client-only)

Used by the auth store and router; not an API entity.

| Field | Type | Notes |
|-------|------|--------|
| token | string \| null | JWT from login/register; stored in localStorage (or sessionStorage) |
| user | User \| null | Current user from AuthResponse |
| redirectAfterLogin | string \| null | Route path to navigate to after successful sign-in (FR-004a) |

**User** (from auth API `AuthResponse.user`): id, email, nickname, tenantId, isTenantAdmin (and any other fields the API returns).

**Validation**: Token present and not expired (or rely on 401 to clear). On 401, clear token and user, set redirectAfterLogin from current route, navigate to sign-in.

---

## Meal (from API)

Mirrors API schema `Meal`. Used in library list, library detail, day plan slots, and history.

| Field | Type | Notes |
|-------|------|--------|
| id | string (UUID) | |
| mealName | string | |
| recipeLink | string \| null | |
| mealImageId | string \| null | |
| isArchived | boolean | When true, show archived indicator in week/history (FR-009, FR-018) |
| qualities | MealQualities | |
| ingredients | Ingredient[] | |
| createdBy | string (UUID) | |
| tenantId | string (UUID) | |
| createdAt | string (date-time) | |
| updatedAt | string (date-time) | |
| deletedAt | string \| null | |

**MealQualities**: id, isDinner, isLunch, isCreamy, isAcidic, greenVeg, makesLunch, isEasyToMake, needsPrep (all booleans; API enforces isCreamy/isAcidic mutual exclusion).

**Ingredient**: id, ingredientName, staple, storageType (enum: Fridge | Pantry | Frozen | Other), tenantId, createdAt, updatedAt.

**Create/Update**: Use API request shapes `CreateMealRequest` (mealName, qualities, optional recipeLink, mealImageId, ingredientIds) and `UpdateMealRequest` (same, all optional except as required by API).

---

## PlannedWeek (from API)

Mirrors API schema `PlannedWeek`. Used for current week, next week, and history list/detail.

| Field | Type | Notes |
|-------|------|--------|
| id | string (UUID) | |
| startingDate | string (date, YYYY-MM-DD) | Week start; aligns with tenant weekStartDay |
| dayPlans | DayPlan[] | Length 7 |
| tenantId | string (UUID) | |
| createdAt | string (date-time) | |
| updatedAt | string (date-time) | |

---

## DayPlan (from API)

Mirrors API schema `DayPlan`. One per day in a week; used in week view and history.

| Field | Type | Notes |
|-------|------|--------|
| id | string (UUID) | |
| date | string (date, YYYY-MM-DD) | |
| longDay | string | e.g. "Monday" (from API) |
| shortDay | string | e.g. "Mon" |
| isLeftover | boolean | Lunch auto-filled from previous dinner |
| lunchMeal | Meal \| null | |
| dinnerMeal | Meal \| null | |
| plannedWeekId | string (UUID) | |
| createdAt | string (date-time) | |
| updatedAt | string (date-time) | |

**Update**: API accepts lunchMealId and dinnerMealId (UUID or null to clear).

---

## UserSettings (from API)

Mirrors API schema `UserSettings`. Tenant-level; only tenant admins can update (FR-021–FR-024).

| Field | Type | Notes |
|-------|------|--------|
| id | string (UUID) | |
| weekStartDay | enum | Monday | Saturday | Sunday |
| dailyPreferences | DailyPreferences[] | Length 7; one per day |
| tenantId | string (UUID) | |
| createdAt | string (date-time) | |
| updatedAt | string (date-time) | |

**DailyPreferences**: day (e.g. "Monday"), preferences (QualityPreferences: isCreamy, isAcidic, greenVeg, isEasyToMake, needsPrep — all optional booleans).

**Update**: Use API `UpdateUserSettingsRequest` (weekStartDay, dailyPreferences).

---

## Store state (Pinia)

- **authStore**: token, user, redirectAfterLogin; actions: login, logout, setRedirect, clearRedirect, loadFromStorage; getters: isAuthenticated, isTenantAdmin.
- **libraryStore**: meals (array), loading, error; current meal (for detail/edit); actions: fetchMeals, fetchMeal, createMeal, updateMeal, archiveMeal.
- **weekPlanStore**: currentWeek, nextWeek (or single “active” week + mode), loading, error; actions: fetchCurrentWeek, fetchNextWeek, fetchPlannedWeek(id), updateDayPlan(dayPlanId, { lunchMealId?, dinnerMealId? }), createPlannedWeek(startingDate) if API supports.
- **historyStore**: pastWeeks (array of PlannedWeek or summary), loading, error; actions: fetchHistory (params per API: pagination, date range, etc.).
- **settingsStore**: userSettings (object or null), loading, error; actions: fetchSettings, updateSettings (admin only); getter: canEdit (isTenantAdmin from authStore).

Loading and error are used to show loading indicators (FR-004b) and error messages.

---

## Identity and lifecycle

- **Meals**: Listed by tenant (API); create returns full Meal; update/archive by meal id. Archived meals excluded from library list; still appear in dayPlans with isArchived true.
- **PlannedWeek**: Identified by id; list filtered by startDate/endDate (current/next/history). Day plans updated by dayPlanId.
- **UserSettings**: One per tenant; get and update by tenant (API infers from JWT).

No client-side persistence of entities beyond what is in memory and token in localStorage; all mutations go through the API.

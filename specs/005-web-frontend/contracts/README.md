# Contracts: Web Frontend (005-web-frontend)

**Feature**: 005-web-frontend  
**Date**: 2026-02-15

## Consumed API contracts

This feature does **not** introduce new REST endpoints. The frontend consumes the existing APIs. Use the following OpenAPI specs as the source of truth for request/response shapes and endpoints:

- **Authentication (login, logout, user)**: [specs/003-user-auth/contracts/openapi.yaml](../../003-user-auth/contracts/openapi.yaml)  
  - Base path: `/api/v1` (or as configured)  
  - Endpoints used: `POST /auth/login`, `POST /auth/logout` (if present), `GET /auth/me` or profile (if present).  
  - Auth response: `{ token, user }`; include `Authorization: Bearer <token>` for protected calls.

- **Meal planning (meals, planned weeks, day plans, user settings)**: [specs/001-meal-planning-api/contracts/openapi.yaml](../../001-meal-planning-api/contracts/openapi.yaml)  
  - Base path: `/api/v1` (or as configured)  
  - Endpoints used:
    - **Meals**: `GET /meals`, `POST /meals`, `GET /meals/:mealId`, `PUT /meals/:mealId`, `DELETE /meals/:mealId` (archive), optionally `GET /meals/eligible?date=&mealType=`
    - **Planned weeks**: `GET /planned-weeks` (query: startDate, endDate, pagination), `POST /planned-weeks`, `GET /planned-weeks/:id`, optionally `DELETE /planned-weeks/:id`
    - **Day plans**: `GET /day-plans/:id`, `PUT /day-plans/:id` (body: lunchMealId, dinnerMealId)
    - **User settings**: `GET /user-settings`, `PUT /user-settings` (tenant admin only)

All protected endpoints require `Authorization: Bearer <token>`. On 401, the frontend must clear auth and redirect to sign-in, preserving the current route for post-login return (FR-004a).

## Data shapes

Entity shapes (Meal, PlannedWeek, DayPlan, UserSettings, MealQualities, Ingredient, etc.) are defined in the OpenAPI schemas above. The frontend should align types (TypeScript interfaces/types) with those schemas; see [data-model.md](../data-model.md) for the client-side view of the same entities.

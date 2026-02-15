# Implementation Plan: Web Frontend for Vegan Meal Planning

**Branch**: `005-web-frontend` | **Date**: 2026-02-15 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/005-web-frontend/spec.md`

## Summary

Build a browser-based web frontend for the vegan meal planning app that consumes the existing Bun/TypeScript API. Users sign in and sign out (JWT via existing auth API); when signed in they manage the meal library (view, create, edit, remove), view and update current/next week plans (lunch and dinner per day), view read-only history of past weeks, and tenant admins view/update tenant settings. The frontend uses **Vue 3 with Composition API**, **Pinia** for state, **date-fns** (with utility wrappers) for dates, and **reusable CSS variables** from `src/web/styles.css`. Implementation order: small reusable components first (e.g. Button, Heading, LoadingSpinner), then layout and pages that use them; no Options API; no extra libraries beyond Vue, Pinia, and date-fns; modern HTML and JS; always check for existing components and CSS classes.

## Technical Context

**Language/Version**: TypeScript 5.x, Bun runtime (existing); Vue 3.x (Composition API only), ES modules  
**Primary Dependencies**: Vue 3, Pinia, date-fns (existing); frontend build/dev via Vite (recommended for Vue 3 HMR)  
**Storage**: None client-side; all data via existing REST API (JWT in memory/localStorage per research)  
**Testing**: Bun test for unit tests (stores, composables, date utils); `./scripts/check.sh` for validation  
**Target Platform**: Modern browsers (ESM); API runs on Bun (existing)  
**Project Type**: Web (frontend SPA alongside existing API in same repo)  
**Performance Goals**: List/views &lt;3s (spec SC-002, SC-006); sign-in to main app &lt;30s (SC-001); no N+1 or unbounded lists in UI  
**Constraints**: Composition API only; small reusable components with props; use `src/web/styles.css` vars; session expiry → re-sign-in and return to same route (FR-004a); visible loading indicators (FR-004b)  
**Scale/Scope**: Single SPA; meal library, current/next week, history, tenant settings; API-defined history scope

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|--------|
| I. Code Quality (clarity, SRP, DRY, SOLID, style, review) | Pass | Reusable components and composables; single responsibility per component; use existing linters and `./scripts/check.sh` |
| II. Clean Architecture (layer separation, domain-first, interfaces) | Pass | Frontend is UI layer; domain and use cases remain on API; HTTP client abstracted behind services/composables |
| III. Simple Regression Testing (test-first, unit coverage, fast, readable) | Pass | Unit tests for Pinia stores, date utilities, and composables; Given-When-Then; no flaky tests; check script |
| IV. Modular Code & DI | Pass | Composables and Pinia stores; no global state beyond stores; explicit dependencies in composables |
| V. Performance | Pass | Pagination/bounded lists per API; loading states; meet spec latency goals |
| VI. DDD (ubiquitous language, aggregates) | Pass | Use spec terms: MealLibrary, PlannedWeek, DayPlan, Tenant Settings; align with API entities |
| VII. Vegan-First Testing | Pass | Test data and examples use vegan meals only |
| Quality Gates (design review, test-first, check script) | Pass | Plan → tests → implement; use `bun run check` |

**No violations.** Complexity Tracking section left empty.

## Project Structure

### Documentation (this feature)

```text
specs/005-web-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (frontend state / view models)
├── quickstart.md        # Phase 1 output (run API + web, env)
├── contracts/           # Phase 1: consumed API (see contracts/README.md)
└── tasks.md             # Phase 2 output (/speckit.tasks - not created by plan)
```

### Source Code (repository root)

```text
src/
├── index.ts             # Existing Bun API entry
├── infrastructure/     # Existing API (routes, DI, etc.)
├── domain/              # Existing domain (if any)
└── web/                 # Vue 3 SPA (Composition API, Pinia)
    ├── styles.css       # Existing CSS variables (use these; add new only if needed)
    ├── index.html       # SPA entry HTML
    ├── main.ts          # Vue app mount + Pinia
    ├── App.vue          # Root component (router-view, layout)
    ├── components/      # Reusable components (build these first)
    │   ├── ui/          # Button, Heading, LoadingSpinner, etc.
    │   └── ...          # Feature-specific reusable (e.g. MealCard, DaySlot)
    ├── views/           # Page-level components (Library, WeekPlan, History, Settings)
    ├── composables/     # useAuth, useApi, useDate, etc.
    ├── stores/          # Pinia stores (auth, library, weekPlan, settings)
    ├── services/        # API client (auth, meals, plannedWeeks, userSettings)
    ├── router/          # Vue Router (guards, route preservation on re-sign-in)
    └── utils/           # date-fns wrappers (formatWeek, formatDay, etc.)

tests/
├── unit/                # Stores, composables, date utils
└── ...                  # Existing API tests unchanged
```

**Structure Decision**: Frontend lives under `src/web/` alongside the existing API in `src/`. Reusable UI components go in `src/web/components/ui/` and are used by views. API is consumed via services/composables; Pinia holds client state. Contracts reference existing OpenAPI in `specs/001-meal-planning-api/contracts/` and `specs/003-user-auth/contracts/`.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*None.*

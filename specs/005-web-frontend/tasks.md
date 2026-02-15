# Tasks: Web Frontend for Vegan Meal Planning

**Input**: Design documents from `specs/005-web-frontend/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Unit tests for date utils, Pinia stores, and composables (per plan Constitution Check). Test tasks are included.

**Organization**: Tasks are grouped by user story so each story can be implemented and tested independently. Foundational phase includes reusable UI components and shared infrastructure (per plan: build these first).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story (US1–US5); no label for Setup, Foundational, or Polish
- Include exact file paths in descriptions

## Path Conventions

- Frontend: `src/web/` at repository root (Vue SPA alongside existing API in `src/`)
- Tests: `tests/unit/` for frontend unit tests

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, Vite + Vue + Pinia, and web app shell

- [ ] T001 Create `src/web/index.html` as SPA entry with root div and script to main.ts
- [ ] T002 Add Vue 3, Pinia, vue-router, and Vite + @vitejs/plugin-vue to package.json (devDependencies for Vite)
- [ ] T003 Create `vite.config.ts` at repo root with Vue plugin and proxy `/api` to `http://localhost:3000`
- [ ] T004 Create `src/web/main.ts` to create Vue app, install Pinia and Router, mount to #app
- [ ] T005 Create `src/web/App.vue` with `<router-view />` and minimal layout shell
- [ ] T006 Add npm/bun script `dev:web` to run Vite dev server in package.json
- [ ] T007 [P] Create directory structure under `src/web/`: components/ui, views, composables, stores, services, router, utils

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Reusable UI components, date utils, API client base, and shared types. MUST be complete before any user story. Per plan: build small reusable components first, then use them in later steps.

**Independent Test**: UI components render; date utils return expected strings; API client sends requests with base URL and optional Bearer token.

### Date utilities and tests

- [ ] T008 [P] Create `src/web/utils/date.ts` with date-fns wrappers: formatDisplayDate, formatWeekRange, getWeekStartDate, addDays (per research and data-model)
- [ ] T009 [P] Add unit tests for date utils in `tests/unit/web/utils/date.test.ts`

### Reusable UI components (use `src/web/styles.css` vars only)

- [ ] T010 [P] Create `src/web/components/ui/Button.vue` with props variant (primary/secondary/danger), disabled; use CSS vars from src/web/styles.css
- [ ] T011 [P] Create `src/web/components/ui/Heading.vue` with props level or size for headings; use CSS vars
- [ ] T012 [P] Create `src/web/components/ui/LoadingSpinner.vue` for FR-004b loading indicators; use CSS vars
- [ ] T013 [P] Create `src/web/components/ui/Card.vue` (optional container) and `src/web/components/ui/Input.vue` (text input with label slot) using CSS vars; prefer modern HTML

### API client and types

- [ ] T014 Create `src/web/services/api.ts` with base URL from env (e.g. VITE_API_BASE_URL), fetch helper that adds `Authorization: Bearer <token>` from a getter (token injected or from store), and 401 handling that clears auth and sets redirect (per research)
- [ ] T015 [P] Create shared TypeScript types/interfaces in `src/web/types/` for Meal, PlannedWeek, DayPlan, UserSettings, MealQualities, Ingredient, User (align with data-model.md and API contracts)

**Checkpoint**: Foundation ready — reusable components, date utils, API client, and types exist. User story implementation can begin.

---

## Phase 3: User Story 1 — Sign In and Sign Out (Priority: P1) — MVP

**Goal**: Users can sign in with existing API credentials, see they are signed in, sign out, and be redirected to sign-in when accessing protected routes. On session expiry (401), user is sent to sign-in and returned to the same page after re-sign-in (FR-004a).

**Independent Test**: Open app → redirect to sign-in; sign in with valid credentials → see identity/sign-out and access protected area; sign out → cannot access protected area; trigger 401 → redirect to sign-in then sign in → land on same page.

### Tests for User Story 1

- [ ] T016 [P] [US1] Add unit tests for auth store (login, logout, setRedirect, clearRedirect, loadFromStorage) in `tests/unit/web/stores/auth.test.ts`

### Implementation for User Story 1

- [ ] T017 [US1] Create Pinia auth store in `src/web/stores/auth.ts`: state (token, user, redirectAfterLogin), actions (login, logout, setRedirect, clearRedirect, loadFromStorage), getters (isAuthenticated, isTenantAdmin); persist token to localStorage
- [ ] T018 [US1] Create auth service in `src/web/services/auth.ts`: login(email, password) calling POST /auth/login, map response to token and user; logout (clear store)
- [ ] T019 [US1] Create Vue Router in `src/web/router/index.ts` with routes: sign-in, protected placeholder (e.g. /library); beforeEach guard: if not authenticated redirect to sign-in and save current path to store redirectAfterLogin; after login navigate to redirectAfterLogin or default
- [ ] T020 [US1] Create sign-in view in `src/web/views/SignIn.vue` (form email/password, call auth store login, on success router.push to redirect or default)
- [ ] T021 [US1] Update `src/web/App.vue` with router-view and header showing user identity and sign-out when authenticated; sign-out calls auth store logout and router.push to sign-in
- [ ] T022 [US1] Wire 401 in `src/web/services/api.ts` to clear auth store and set redirectAfterLogin from current route, then navigate to sign-in (ensure router/store are usable from API layer, e.g. pass router or callback)

**Checkpoint**: User Story 1 complete. Sign in, sign out, route guard, and route preservation on re-sign-in work.

---

## Phase 4: User Story 2 — Manage Meal Library (Priority: P2)

**Goal**: Signed-in users can view meal list, create a meal, view/edit meal details, and remove (archive) a meal. Empty state when library is empty. Loading indicator while fetching (FR-004b).

**Independent Test**: Sign in, open library → list of meals (or empty state); create meal → appears in list; open meal → detail; edit and save → list updated; remove meal → no longer in list.

### Tests for User Story 2

- [ ] T023 [P] [US2] Add unit tests for library store (fetchMeals, fetchMeal, createMeal, updateMeal, archiveMeal, loading state) in `tests/unit/web/stores/library.test.ts`

### Implementation for User Story 2

- [ ] T024 [US2] Create meal service in `src/web/services/meals.ts`: listMeals, getMeal(id), createMeal(body), updateMeal(id, body), archiveMeal(id) using api.ts and types
- [ ] T025 [US2] Create Pinia library store in `src/web/stores/library.ts`: state (meals, currentMeal, loading, error), actions calling meal service, expose loading for FR-004b
- [ ] T026 [US2] Create library list view in `src/web/views/Library.vue`: show LoadingSpinner when loading; list meals or empty state (message/prompt to add); link/button to add meal and to open meal detail
- [ ] T027 [US2] Create meal detail/edit view (e.g. `src/web/views/MealDetail.vue` or modal): display name, qualities, ingredients, recipe link, image id; edit form with save; use Button, Heading, Input from components/ui
- [ ] T028 [US2] Create “add meal” flow (new view or inline form): required name and qualities (and ingredients per API); submit via library store createMeal; redirect or refresh list
- [ ] T029 [US2] Add remove/archive action in meal detail or list (confirm if desired); call library store archiveMeal; show archived indicator in week plans (FR-010) is covered when rendering meal in week/history views later
- [ ] T030 [US2] Add route(s) for library and meal detail in `src/web/router/index.ts`; ensure nav link to Library in App.vue when authenticated

**Checkpoint**: User Story 2 complete. Meal library CRUD and empty state work with loading indicators.

---

## Phase 5: User Story 3 — View and Update Current and Next Week Plans (Priority: P2)

**Goal**: Signed-in users see current and next week (7 days, tenant week start day), lunch and dinner per day, assign or clear meals. Leftover auto-fill shown when applicable (FR-015, FR-016 optional).

**Independent Test**: Sign in, open current week → 7 days with lunch/dinner slots; assign meal to a slot → persists; clear slot → updated; switch to next week → same structure.

### Tests for User Story 3

- [ ] T031 [P] [US3] Add unit tests for weekPlan store (fetchCurrentWeek, fetchNextWeek, updateDayPlan, loading) in `tests/unit/web/stores/weekPlan.test.ts`

### Implementation for User Story 3

- [ ] T032 [US3] Create planned-weeks and day-plan services in `src/web/services/plannedWeeks.ts` and `src/web/services/dayPlans.ts`: listPlannedWeeks(params), getPlannedWeek(id), createPlannedWeek(body); getDayPlan(id), updateDayPlan(id, { lunchMealId?, dinnerMealId? })
- [ ] T033 [US3] Create Pinia weekPlan store in `src/web/stores/weekPlan.ts`: state (currentWeek, nextWeek, loading, error); actions to fetch current/next week (using tenant week start and date utils), update day plan; expose loading for FR-004b
- [ ] T034 [US3] Create week plan view in `src/web/views/WeekPlan.vue`: tabs or links for “Current week” / “Next week”; for selected week show 7 days (use date utils for labels); per day show lunch and dinner slots with assigned meal or “Assign”; use LoadingSpinner when loading
- [ ] T035 [US3] Implement assign meal to slot: picker/modal to choose meal from library (list from library store), then call updateDayPlan with meal id; implement clear slot with updateDayPlan(..., null)
- [ ] T036 [US3] Show isLeftover indicator for lunch when day plan has isLeftover true (per API); show archived meal indicator (FR-010) when meal isArchived
- [ ] T037 [US3] Handle “no current/next week yet”: empty or uninitialized state and create week via API if supported (per spec edge case)
- [ ] T038 [US3] Add routes for week plan view and nav link in App.vue when authenticated

**Checkpoint**: User Story 3 complete. Current and next week are viewable and editable with assign/clear.

---

## Phase 6: User Story 4 — View History of Previous Week Plans (Priority: P3)

**Goal**: Signed-in users see a history view listing past weeks (per API); open a week to see read-only 7-day structure and meal assignments; archived meals shown with indicator. Empty state when no history (FR-017–FR-020).

**Independent Test**: Sign in, open History → list of past weeks or empty state; open a week → 7 days read-only; archived meals have indicator; no edit controls.

### Implementation for User Story 4

- [ ] T039 [US4] Create history store in `src/web/stores/history.ts` (or extend weekPlan store with history list): fetch past weeks via listPlannedWeeks with startDate/endDate or pagination per API; state (pastWeeks, loading, error); expose loading for FR-004b
- [ ] T040 [US4] Create history view in `src/web/views/History.vue`: list past weeks (e.g. by startingDate from date utils); click week → show read-only week detail (reuse same 7-day structure as WeekPlan but no assign/clear); LoadingSpinner when loading; empty state when no past weeks
- [ ] T041 [US4] Show archived meal indicator (FR-018) for meals with isArchived in history week detail
- [ ] T042 [US4] Add route for history and nav link in App.vue when authenticated

**Checkpoint**: User Story 4 complete. History is read-only with correct structure and empty state.

---

## Phase 7: User Story 5 — Admin: View and Update Tenant Settings (Priority: P3)

**Goal**: Tenant admins can view and update week start day and daily quality preferences; non-admins can only view (or not see edit). Loading indicator while fetching (FR-004b, FR-021–FR-024).

**Independent Test**: Sign in as admin → open Settings → edit and save → settings updated; sign in as non-admin → no update option or read-only.

### Tests for User Story 5

- [ ] T043 [P] [US5] Add unit tests for settings store (fetchSettings, updateSettings, canEdit) in `tests/unit/web/stores/settings.test.ts`

### Implementation for User Story 5

- [ ] T044 [US5] Create user settings service in `src/web/services/userSettings.ts`: getSettings(), updateSettings(body) using api.ts; update only called when user is tenant admin (enforced by API)
- [ ] T045 [US5] Create Pinia settings store in `src/web/stores/settings.ts`: state (userSettings, loading, error); getter canEdit from auth store isTenantAdmin; actions fetchSettings, updateSettings; expose loading for FR-004b
- [ ] T046 [US5] Create settings view in `src/web/views/Settings.vue`: show weekStartDay and dailyPreferences (read-only for all); if canEdit show form and save button; LoadingSpinner when loading; use Button, Heading, Input
- [ ] T047 [US5] Hide settings nav or show read-only for non-admins (FR-023, FR-024); only expose “Settings” with edit to tenant admins
- [ ] T048 [US5] Add route for settings and nav link in App.vue when authenticated (visible or edit-only per role)

**Checkpoint**: User Story 5 complete. Tenant admins can update settings; non-admins cannot.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Error handling, backend-unavailable messaging, and validation

- [ ] T049 Show clear error/retry UI when backend is temporarily unavailable (per spec edge case) in API client or a shared error composable/component
- [ ] T050 Run quickstart validation: ensure `specs/005-web-frontend/quickstart.md` steps (install, run API, run dev:web, sign in) work end-to-end
- [ ] T051 Run `./scripts/check.sh` and fix any format, lint, or test failures in new code under src/web and tests/unit/web

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all user stories. Reusable components and API client must exist before story-specific views.
- **Phase 3 (US1)**: Depends on Phase 2. No dependency on US2–US5.
- **Phase 4 (US2)**: Depends on Phase 2 and US1 (auth for protected routes).
- **Phase 5 (US3)**: Depends on Phase 2 and US1; uses library store for meal picker (US2).
- **Phase 6 (US4)**: Depends on Phase 2 and US1; can reuse week structure from US3.
- **Phase 7 (US5)**: Depends on Phase 2 and US1.
- **Phase 8 (Polish)**: Depends on completion of desired user stories.

### User Story Dependencies

- **US1 (P1)**: After Foundational only. MVP.
- **US2 (P2)**: After US1 (auth). Library can be developed once auth and foundation exist.
- **US3 (P2)**: After US1; meal picker benefits from US2 but can use API listMeals if needed.
- **US4 (P3)**: After US1; independent of US2/US3 except shared types and API.
- **US5 (P3)**: After US1; independent of US2/US3/US4.

### Within Each User Story

- Test tasks marked [P] can run in parallel; write tests before or alongside implementation (per Constitution).
- Services before stores; stores before views; wire routes and nav last for that story.

### Parallel Opportunities

- Phase 1: T007 can run in parallel with T001–T006 after T002.
- Phase 2: T008, T009, T010, T011, T012, T013, T015 can run in parallel after T014 (api.ts) if 401 handling is minimal initially; otherwise T010–T013 and T015 in parallel after T008–T009 and T014.
- Phase 3: T016 in parallel with T017–T018; then T019–T022 sequential.
- Phase 4: T023 in parallel with T024–T025; then T026–T030.
- Phase 5: T031 in parallel with T032–T033; then T034–T038.
- Phase 7: T043 in parallel with T044–T045; then T046–T048.
- Different user stories (US2, US3, US4, US5) can be worked in parallel after US1 and Phase 2.

---

## Parallel Example: User Story 1

```text
# Tests and store/service in parallel:
T016 [P] [US1] Unit tests auth store in tests/unit/web/stores/auth.test.ts
T017 [US1] Auth store in src/web/stores/auth.ts
T018 [US1] Auth service in src/web/services/auth.ts

# Then router and views:
T019–T022 sequentially (router, SignIn view, App.vue, 401 wiring).
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup  
2. Complete Phase 2: Foundational (reusable components, date utils, API client, types)  
3. Complete Phase 3: User Story 1 (sign in, sign out, route guard, route preservation)  
4. **STOP and VALIDATE**: Sign in, sign out, access protected route, 401 → re-sign-in → same page  
5. Demo/deploy if ready  

### Incremental Delivery

1. Setup + Foundational → foundation ready  
2. Add US1 → test independently → MVP  
3. Add US2 → meal library → test independently  
4. Add US3 → week plans → test independently  
5. Add US4 → history → test independently  
6. Add US5 → settings (admin) → test independently  
7. Polish (Phase 8)  

### Parallel Team Strategy

After Phase 2 and US1:

- Dev A: US2 (Library)  
- Dev B: US3 (Week plans)  
- Dev C: US4 (History) + US5 (Settings)  

Stories integrate via shared stores and router.

---

## Notes

- [P] = different files, no dependencies on other tasks in same phase (unless noted).  
- [Story] labels map to spec user stories for traceability.  
- Each user story is independently testable per spec “Independent Test”.  
- Use only CSS variables from `src/web/styles.css`; add new colours there if needed and document.  
- Composition API only (`<script setup lang="ts">`); no Options API.  
- Commit after each task or logical group; run `./scripts/check.sh` before considering a phase complete.

# Research: Web Frontend (005-web-frontend)

**Feature**: 005-web-frontend  
**Date**: 2026-02-15

## 1. Vue 3 Composition API (not Options API)

**Decision**: Use Vue 3 with **Composition API** only (`<script setup>` and `composable()` style). Do not use Options API (`data()`, `methods`, etc.).

**Rationale**: User requirement. Composition API gives better TypeScript inference, reuse via composables, and clearer data flow. Single style across the codebase reduces cognitive load.

**Alternatives considered**:
- **Options API**: Explicitly excluded by user.
- **Mix of both**: Rejected; one style only.

**Implementation**: All components use `<script setup lang="ts">`; shared logic in composables (e.g. `useAuth`, `useApi`). Use `ref`, `computed`, `watch` from Vue; no `this`.

---

## 2. Pinia for front-end state

**Decision**: Use **Pinia** as the only global state store. One store per bounded area: auth (user, token, isAuthenticated), meal library (meals list, current meal), week plan (current/next week, selected week), settings (tenant settings, admin flag). No Vuex.

**Rationale**: User requirement. Pinia is the official Vue 3 state library; TypeScript-friendly, composable-friendly, and minimal boilerplate.

**Alternatives considered**:
- **Vuex**: Legacy; Pinia is the recommended replacement for Vue 3.
- **Provide/inject only**: Insufficient for cross-route auth and shared data; Pinia is appropriate.

**Implementation**: Define stores under `src/web/stores/` (e.g. `authStore`, `libraryStore`, `weekPlanStore`, `settingsStore`). Use storeToRefs in components when destructuring to keep reactivity. Persist token per “JWT storage” decision below.

---

## 3. JWT storage and session expiry (route preservation)

**Decision**: Store JWT in **localStorage** (or sessionStorage) so it survives refresh. On 401 from any API call, clear token and user, redirect to sign-in, and **store the intended route** (e.g. `redirectTo` query or a small auth module state). After successful sign-in, navigate to that route (or default) so the user returns to the same page (FR-004a).

**Rationale**: Spec FR-004a requires “after successful sign-in, return the user to the same page or screen they were on”. Storing the route before redirect and applying it after login satisfies this. localStorage keeps the user signed in across refreshes; 401 handling covers expiry.

**Alternatives considered**:
- **Memory only**: Token lost on refresh; worse UX; rejected.
- **Cookie (httpOnly)**: Would require API changes; spec says “same authentication mechanism as the existing API” (JWT in response). Client-side token storage is the norm for SPA + existing JWT API; accepted.
- **No route preservation**: Would violate FR-004a; rejected.

**Implementation**: Auth store holds `token`, `user`, and optionally `redirectAfterLogin` (route path). On 401 (centralized in API client or interceptor), set `redirectAfterLogin = router.currentRoute.value.fullPath` (or equivalent), clear auth, navigate to sign-in. On successful login, navigate to `redirectAfterLogin` or default (e.g. library or week plan), then clear `redirectAfterLogin`.

---

## 4. Reusable components and CSS

**Decision**: Build **small, reusable components first** (e.g. Button, Heading, LoadingSpinner, Card, Input) with **props for variations**. Always check for existing components and CSS classes before adding new ones. Use **CSS variables from `src/web/styles.css`** (e.g. `var(--color-primary)`, `var(--color-error)`); if a new colour is needed, add it to `styles.css` and document (or prompt the user per plan). Prefer **modern HTML** (semantic elements, native form controls) over heavy custom components.

**Rationale**: User requirement. Reusable components reduce duplication and keep UI consistent. Existing `styles.css` already defines a palette; reusing it keeps the look consistent and avoids magic values.

**Alternatives considered**:
- **One-off components per page**: Rejected; plan explicitly asks for reusable components first.
- **New colour variables ad hoc in components**: Rejected; centralize in `styles.css` and ask user if new colour needed.
- **Third-party UI library**: User said no additional libraries; rejected.

**Implementation**: Create `src/web/components/ui/` with Button (e.g. variant: primary/secondary/danger, disabled), Heading (level 1–4 or size prop), LoadingSpinner, and similar. Use BEM-like or simple class names and CSS vars. In each new component or style, search codebase for existing class or component before adding.

---

## 5. date-fns and date handling

**Decision**: Use **date-fns** (already in the project) for all date logic and formatting. Create **small utility wrappers** in `src/web/utils/date.ts` (or similar) for: week start given a week-start day (Monday/Saturday/Sunday), format date for display, format week range (e.g. “6 Jan – 12 Jan”), and any other shared logic. Use ISO date strings (YYYY-MM-DD) when talking to the API.

**Rationale**: User allowed date-fns and asked for utility wrappers. date-fns is already a dependency; wrappers keep formatting and week math in one place and simplify components/stores.

**Alternatives considered**:
- **Native Date only**: More verbose and error-prone; date-fns is already present; rejected.
- **Other date libs**: User specified date-fns; no need to add another.

**Implementation**: In `src/web/utils/date.ts` (or `dates.ts`), export functions such as `formatDisplayDate(date: string)`, `formatWeekRange(startDate: string, endDate: string)`, `getWeekStartDate(date: Date, weekStartDay: 'Monday'|'Saturday'|'Sunday')`, `addDays(date: string, n: number)`. Use date-fns inside these; components and stores call the wrappers only.

---

## 6. Build and dev server for Vue

**Decision**: Use **Vite** as the build and dev server for the Vue 3 app. Configure Vite to proxy API requests to the existing Bun API (e.g. `/api` → `http://localhost:3000`) so the SPA and API can be developed together. Production build can be served as static files from the Bun server or a separate host.

**Rationale**: Vue 3 is commonly used with Vite; fast HMR and simple config. Bun could bundle Vue, but Vite is the standard and well-documented for Vue. One extra devDependency is justified for DX. Proxying avoids CORS during local dev.

**Alternatives considered**:
- **Bun-only build**: Possible but less common for Vue; Vite is the ecosystem default; rejected for initial implementation.
- **Separate port, no proxy**: CORS must be configured on API; proxy is simpler for dev; accepted proxy approach.

**Implementation**: Add Vite and @vitejs/plugin-vue as devDependencies. Add `vite.config.ts` at repo root (or under `src/web/`) with proxy for `/api` to `http://localhost:3000`. Entry: `src/web/index.html` with script to `main.ts`. Script in package.json: `"dev:web": "vite"` (or `vite build` for production). See quickstart.md for “run API + web” steps.

---

## 7. API client and loading indicators

**Decision**: Use **fetch** (no axios) for HTTP. Centralize in **services** (e.g. `authService`, `mealService`, `plannedWeekService`, `userSettingsService`) that return promises. Pinia stores or composables call these services and set loading/error state. **Loading indicators** (FR-004b): show a visible spinner (or skeleton) when a store/composable is in a “loading” state for library, week plan, history, or settings; use the shared LoadingSpinner component.

**Rationale**: User said no additional libraries; fetch is built-in. Centralized services keep API URLs and headers (e.g. Authorization) in one place. Spec FR-004b requires visible loading for those four data types; a single LoadingSpinner used wherever data is fetched satisfies this.

**Alternatives considered**:
- **Axios**: Extra dependency; user said prefer no extra libs; fetch is sufficient.
- **No loading state**: Would violate FR-004b; rejected.

**Implementation**: e.g. `src/web/services/api.ts` with base URL and helper that adds `Authorization: Bearer <token>` from auth store. Services in `src/web/services/auth.ts`, `meals.ts`, `plannedWeeks.ts`, `userSettings.ts`. Stores set `loading = true` before fetch and `loading = false` in finally; views use `loading` to show LoadingSpinner (or disable buttons) until data is displayed or an error is shown.

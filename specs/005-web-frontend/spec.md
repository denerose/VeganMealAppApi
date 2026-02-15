# Feature Specification: Web Frontend for Vegan Meal Planning

**Feature Branch**: `005-web-frontend`  
**Created**: 15 February 2026  
**Status**: Draft  
**Input**: User description: "Build a web frontend for our vegan meal planning app (using our existing API). The frontend should allow users to login and logout. While logged in they should be able to: view, edit, or remove meals from their MealLibrary; view and update Dinner and Lunch for days in their current week or next week plans; view a separate history page with previous week plans (if any). If they are an admin and logged in: view and update their (tenant level) settings."

## Clarifications

### Session 2026-02-15

- Q: Should the frontend support creating (adding) new meals to the library, or only view, edit, and remove? → A: In scope — users can create (add) new meals to the library as well as view, edit, and remove.
- Q: When session expires, should the app preserve the current page so after re-sign-in the user returns to the same place, or redirect to a default? → A: Return to same page/screen after re-sign-in (preserve route or equivalent).
- Q: Should the spec require visible loading indicators while data is loading (library, week plan, history, settings)? → A: In scope — show visible loading indicators while fetching (e.g. library, week plan, history, settings).
- Q: How much history (previous weeks) should the frontend show — all past weeks, a fixed limit, or API-defined? → A: Show whatever the API supports (e.g. all past weeks or API-defined pagination/limits).
- Q: Should the spec require meeting a specific accessibility standard (e.g. WCAG) or keyboard/assistive tech support? → A: Out of scope for this feature; defer accessibility to a later spec or plan.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Sign In and Sign Out (Priority: P1)

Users need to identify themselves to access the meal planning application. They sign in with their credentials and can sign out when finished. Only signed-in users can access meal library, week plans, and history. The application must clearly indicate whether the user is signed in and provide a reliable way to sign out.

**Why this priority**: Without sign-in, no other features are accessible. This is the gateway to all user-specific and tenant-specific data.

**Independent Test**: Can be fully tested by opening the application, signing in with valid credentials, confirming the user is recognized (e.g., name or identifier shown), then signing out and confirming access to protected areas is no longer available.

**Acceptance Scenarios**:

1. **Given** a user has valid credentials, **When** they sign in, **Then** they are recognized as signed in and can access meal library, week plans, and history
2. **Given** a signed-in user, **When** they choose to sign out, **Then** they are signed out and cannot access protected content without signing in again
3. **Given** a user who is not signed in, **When** they try to access meal library, week plans, or history, **Then** they are directed to sign in (or equivalent) and cannot use those areas until signed in
4. **Given** a signed-in user, **When** they view the application, **Then** it is clear that they are signed in (e.g., visible identity or sign-out option)

---

### User Story 2 - Manage Meal Library (Priority: P2)

Signed-in users need to view, create, edit, and remove meals in their tenant's meal library. They can add new meals, see the list of meals, open a meal to see details (name, qualities, ingredients, optional recipe link and image), change those details, and remove meals from the library. Removed meals no longer appear in the active library but may still appear in existing week plans as archived.

**Why this priority**: The meal library is the source of meals for planning. Users must be able to maintain it before or alongside planning.

**Independent Test**: Can be fully tested by signing in, opening the meal library, creating a new meal, listing meals, editing one meal's details, and removing a meal; then confirming the list reflects changes and removed meals are no longer available for new assignments.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open the meal library, **Then** they see the list of meals for their tenant
2. **Given** a signed-in user, **When** they create a new meal with required details (e.g., name, qualities, ingredients), **Then** the meal is added to the library and appears in the list
3. **Given** a meal in the library, **When** the user opens it, **Then** they see its details (e.g., name, qualities, ingredients, optional recipe and image)
4. **Given** a meal is open for editing, **When** the user saves changes to name, qualities, or ingredients, **Then** the meal is updated and the updated data is shown in the library
5. **Given** a meal in the library, **When** the user removes it, **Then** it no longer appears in the active library and cannot be assigned to new plan slots; if it was already in a week plan, it is still visible there with an archived/removed indicator
6. **Given** the meal library is empty, **When** the user opens it, **Then** they see an empty state (e.g., message or prompt to add meals) rather than an error

---

### User Story 3 - View and Update Current and Next Week Plans (Priority: P2)

Signed-in users need to see their current week and next week meal plans (each week as defined by tenant settings, e.g., Monday–Sunday). For each day they can see lunch and dinner slots, view which meal (if any) is assigned, and update or clear lunch and dinner. They can assign meals from their library to slots and see eligible suggestions when relevant.

**Why this priority**: Planning lunch and dinner for the current and next week is the main use case; it depends on sign-in and benefits from having a maintained library.

**Independent Test**: Can be fully tested by signing in, opening current week and next week views, viewing assigned meals per day, updating lunch or dinner for one or more days, and clearing a slot; then confirming the plan reflects changes.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they open the current week plan, **Then** they see 7 days with lunch and dinner slots and any assigned meals
2. **Given** a signed-in user, **When** they open the next week plan, **Then** they see 7 days with lunch and dinner slots and any assigned meals
3. **Given** a day in current or next week, **When** the user assigns a meal from the library to lunch or dinner, **Then** that slot shows the chosen meal and the plan is updated
4. **Given** a day with an assigned lunch or dinner, **When** the user clears the slot or assigns a different meal, **Then** the plan is updated accordingly
5. **Given** the user's tenant has a configured week start day, **When** they view current or next week, **Then** the week is displayed starting on that day (e.g., Monday, Saturday, or Sunday) with 7 consecutive days
6. **Given** a day where lunch can be auto-filled from the previous day's dinner (e.g., leftovers), **When** the user views the plan, **Then** they see the auto-filled lunch where applicable, and can change or clear it like any other slot

---

### User Story 4 - View History of Previous Week Plans (Priority: P3)

Signed-in users need a dedicated place to view past week plans. They can open a history view and see previous weeks (if any), each with the same structure as current/next week (7 days, lunch and dinner per day). History is read-only; the purpose is to review what was planned in the past.

**Why this priority**: History supports reflection and reuse of past plans; it is not required for day-to-day planning.

**Independent Test**: Can be fully tested by signing in, opening the history view, and confirming that past weeks (if any) are listed and show the correct dates and meal assignments; if there are no past weeks, an appropriate empty state is shown.

**Acceptance Scenarios**:

1. **Given** a signed-in user with at least one past planned week, **When** they open the history page, **Then** they see previous weeks (e.g., by week start date or label) and can open one to view its 7 days and lunch/dinner assignments
2. **Given** a signed-in user with no past planned weeks, **When** they open the history page, **Then** they see an empty state (e.g., message that there is no history yet)
3. **Given** a past week in history, **When** the user views it, **Then** they see the same structure as current/next week (7 days, lunch and dinner per day) and any meals that were assigned, including archived/removed meals with a clear indicator
4. **Given** the history page, **When** the user is viewing it, **Then** they cannot edit past plans from this view (read-only)

---

### User Story 5 - Admin: View and Update Tenant Settings (Priority: P3)

Tenant administrators who are signed in need to view and update their tenant's settings. These settings affect week structure (e.g., week start day) and meal preferences used for suggestions (e.g., quality preferences per day). Only users with tenant admin role can change settings; non-admin users cannot update them.

**Why this priority**: Settings personalize planning for the whole tenant but are not required for basic planning; admin capability is a distinct role.

**Independent Test**: Can be fully tested by signing in as a tenant admin, opening the tenant settings area, viewing current settings, changing week start day or daily preferences, saving, and confirming the new settings are reflected; and by signing in as a non-admin and confirming they cannot update settings.

**Acceptance Scenarios**:

1. **Given** a signed-in user who is a tenant admin, **When** they open tenant settings, **Then** they see the current settings (e.g., week start day and daily meal quality preferences)
2. **Given** a tenant admin viewing settings, **When** they change week start day or daily preferences and save, **Then** the settings are updated and apply to the tenant (e.g., future week views and eligible meal suggestions reflect the new settings)
3. **Given** a signed-in user who is not a tenant admin, **When** they try to update tenant settings, **Then** they cannot update them (e.g., settings are read-only or the update option is unavailable)
4. **Given** a non-admin user, **When** they open the application, **Then** they do not see tenant settings management (or see it as read-only) so the scope of admin-only actions is clear

---

### Edge Cases

- What happens when the user's session expires or is invalid while they are using the application? The application MUST prompt the user to sign in again and, after successful sign-in, return them to the same page or screen they were on (preserve route or equivalent).
- What happens when the user has no current or next week plan yet? The application should allow them to view an empty or uninitialized state and create or load a plan as supported by the API.
- What happens when the user tries to remove a meal that is assigned in current or next week? The meal is removed from the library (archived) and remains visible in those plans with an archived/removed indicator; it cannot be assigned to new slots.
- How does the application behave when the backend is temporarily unavailable? Users see a clear indication of the problem and can retry or sign out as appropriate.
- What happens when a tenant admin and another user both change tenant settings? The last successful save wins; the application does not need to implement real-time conflict resolution beyond what the API provides.

## Requirements *(mandatory)*

### Functional Requirements

#### Authentication and Access

- **FR-001**: The application MUST allow users to sign in using the same authentication mechanism as the existing API
- **FR-002**: The application MUST allow signed-in users to sign out
- **FR-003**: The application MUST restrict access to meal library, current week, next week, and history to signed-in users only
- **FR-004**: The application MUST make it clear to the user whether they are signed in and MUST provide a visible way to sign out when signed in
- **FR-004a**: When the user's session expires or is invalid, the application MUST prompt to sign in again and, after successful sign-in, return the user to the same page or screen they were on (preserve route or equivalent)
- **FR-004b**: The application MUST show a visible loading indicator when fetching meal library, current or next week plan, history, or tenant settings until the data is displayed or an error is shown

#### Meal Library

- **FR-005**: The application MUST allow signed-in users to view the list of meals in their tenant's meal library
- **FR-006**: The application MUST allow signed-in users to create (add) new meals to the library with required details (e.g., name, qualities, ingredients) and optional recipe link and image
- **FR-007**: The application MUST allow signed-in users to view details of a meal (e.g., name, qualities, ingredients, optional recipe link and image)
- **FR-008**: The application MUST allow signed-in users to edit a meal's details and save changes so the library is updated
- **FR-009**: The application MUST allow signed-in users to remove a meal from the library; removed meals MUST no longer appear in the active library and MUST NOT be assignable to new plan slots
- **FR-010**: The application MUST show archived/removed meals that appear in existing week plans with a clear indicator so users understand they are no longer in the active library

#### Week Plans (Current and Next)

- **FR-011**: The application MUST allow signed-in users to view the current week plan (7 days aligned to the tenant's week start day) with lunch and dinner slots and any assigned meals
- **FR-012**: The application MUST allow signed-in users to view the next week plan with the same structure as the current week
- **FR-013**: The application MUST allow signed-in users to assign a meal from the library to any lunch or dinner slot in current or next week
- **FR-014**: The application MUST allow signed-in users to clear (unassign) lunch or dinner in any day in current or next week
- **FR-015**: The application MUST display the week start day and 7 consecutive days in line with the tenant's configured week start day
- **FR-016**: The application MAY offer eligible meal suggestions when the user chooses a meal for a slot; if so, users MUST still be able to assign any meal from the library to that slot

#### History

- **FR-017**: The application MUST provide a dedicated history view where signed-in users can see previous week plans (if any); the set of weeks shown MUST follow what the API supports (e.g. all past weeks or API-defined pagination/limits)
- **FR-018**: The application MUST display each past week in history with the same structure (7 days, lunch and dinner per day) and assigned meals, including archived meals with an indicator
- **FR-019**: The application MUST treat history as read-only; users cannot edit past week plans from the history view
- **FR-020**: The application MUST show an appropriate empty state when the user has no previous week plans

#### Tenant Settings (Admin)

- **FR-021**: The application MUST allow signed-in users with tenant admin role to view their tenant's settings (e.g., week start day and daily meal quality preferences)
- **FR-022**: The application MUST allow signed-in tenant admins to update tenant settings and save changes so they apply to the tenant
- **FR-023**: The application MUST prevent signed-in users who are not tenant admins from updating tenant settings; they may view settings as read-only or not see the settings management area, as appropriate
- **FR-024**: The application MUST only expose tenant settings management (or write access to it) to users who are tenant admins

### Key Entities

These entities are defined by the existing meal planning API; the frontend presents and manipulates them through the API.

- **User (signed-in)**: The person using the web application. Identified after sign-in; has a tenant and may have tenant admin role. Determines what data (library, plans, settings) is visible and editable.

- **Meal Library**: The tenant's collection of meals. Each meal has name, qualities, ingredients, and optional recipe link and image. Meals can be created, viewed, edited, and removed (archived); archived meals stay visible in historical plans but not in the active library.

- **Planned Week**: A 7-day plan starting on the tenant's week start day. Has lunch and dinner slots per day. Current and next week are editable; past weeks appear in history as read-only.

- **Day Plan**: A single day within a week, with lunch and dinner slots and optional meal assignments. Displayed in current week, next week, and history.

- **Tenant Settings**: Week start day (e.g., Monday, Saturday, Sunday) and daily meal quality preferences. Shared by all users in the tenant. Viewable by all signed-in users in the tenant; only tenant admins can update them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can sign in and reach the main application (e.g., meal library or week plan) within 30 seconds of submitting valid credentials
- **SC-002**: A signed-in user can view their meal library and see the full list of meals in under 3 seconds under normal conditions
- **SC-003**: A signed-in user can add a new meal to the library (with required details) in under 1 minute
- **SC-004**: A signed-in user can complete a single edit to a meal (open, change, save) in under 30 seconds
- **SC-005**: A signed-in user can view current week and next week plans and update at least one lunch or dinner slot in under 2 minutes
- **SC-006**: A signed-in user can open the history view and see at least one past week (when history exists) in under 3 seconds
- **SC-007**: A tenant admin can open tenant settings, change one setting, and save in under 1 minute
- **SC-008**: Non-admin users are never able to successfully update tenant settings (100% of update attempts by non-admins are blocked or unavailable)
- **SC-009**: After sign-out, the user cannot access meal library, week plans, history, or tenant settings without signing in again

## Assumptions

- The existing API provides authentication, meal library, week plans, history (past weeks), and tenant settings endpoints; the frontend consumes these and does not replace backend logic
- "Current week" and "next week" are determined by the API or by the tenant's week start day and current date; the frontend displays whatever the API returns
- Week start day and daily quality preferences are defined and stored by the API; the frontend only displays and submits them for tenant admins
- Tenant admin role is determined by the API (e.g., isTenantAdmin flag); the frontend shows or hides settings management based on that role
- Session and token handling (e.g., refresh, expiry) follow the API's authentication model; the frontend prompts to sign in again when the session is invalid
- The application is used in a single timezone or date context per tenant; timezone handling for dates is as defined by the API
- User registration and tenant creation are out of scope; users and tenants already exist
- The frontend is a web application (browser-based); exact devices and browsers are not specified in this document
- History scope (how many past weeks are shown) is determined by the API; the frontend displays whatever the API returns (e.g. all past weeks or API-defined pagination/limits)
- Accessibility (e.g. WCAG, keyboard navigation, screen reader support) is out of scope for this feature and deferred to a later spec or plan

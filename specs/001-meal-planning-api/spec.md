# Feature Specification: Vegan Meal Planning API

**Feature Branch**: `001-001-meal-planning-api`  
**Created**: 30 December 2025  
**Status**: Draft  
**Input**: User description: "Build the backend API for a vegan meal planning app that allows users to plan their Lunch and Dinner meals for the week by selecting from the MealLibrary and manage their MealLibrary."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and Manage Weekly Meal Plans (Priority: P1)

Users need to plan their weekly lunches and dinners by selecting meals from their personal meal library. Each week starts on a configurable day (Monday, Saturday, or Sunday) and contains 7 days of meal planning. Users can view eligible meals for each day based on their dietary preferences and quality settings.

**Why this priority**: This is the core value proposition - without weekly meal planning, there is no app. This delivers immediate value by helping users organize their week.

**Independent Test**: Can be fully tested by creating a user account, configuring their week start day, and assigning meals to lunch and dinner slots for a 7-day period, then retrieving and viewing the planned week.

**Acceptance Scenarios**:

1. **Given** a user with configured settings (starting day = Monday), **When** they create a new planned week for the week of January 6, 2025, **Then** a week is created with 7 day plans starting from Monday January 6 through Sunday January 12
2. **Given** a user has a planned week, **When** they assign a meal from their library to Tuesday dinner, **Then** the meal appears in the Tuesday dinner slot
3. **Given** a user views a specific day in their plan, **When** they request eligible meals for that day's lunch, **Then** they receive only meals that match their lunch quality preferences for that day
4. **Given** a user has assigned a "makes lunch" meal to Monday dinner, **When** they view Tuesday's plan and Tuesday lunch is null, **Then** Tuesday lunch is automatically populated with leftovers from Monday dinner
5. **Given** a user with starting day = Saturday, **When** they create a planned week for January 4, 2025, **Then** the week starts on Saturday January 4 and ends on Friday January 10

---

### User Story 2 - Build and Maintain Personal Meal Library (Priority: P2)

Users need to create, edit, and organize their collection of vegan meals. Each meal has a name, quality attributes (creamy, acidic, green vegetables, etc.), key ingredients, and optional recipe links and images. All users within a tenant can contribute to and edit the shared meal library.

**Why this priority**: Without a meal library, users have nothing to plan with. This is foundational but secondary to the planning experience itself. Users need both, but planning is the primary user goal.

**Independent Test**: Can be fully tested by creating meals with various attributes, updating meal properties, listing all meals in the library, and filtering meals by qualities - all without requiring the planning functionality.

**Acceptance Scenarios**:

1. **Given** a user has access to their tenant's meal library, **When** they create a new meal "Cauliflower Bake" with key ingredient "Cauliflower" and quality "isCreamy = true", **Then** the meal is saved and appears in the library
2. **Given** a meal exists with "isCreamy = true", **When** a user attempts to also set "isAcidic = true", **Then** the system prevents this (mutually exclusive qualities)
3. **Given** a user creates a meal, **When** they add an optional recipe URL and image ID, **Then** both are stored with the meal
4. **Given** multiple users in the same tenant, **When** any user adds or edits a meal, **Then** all users in that tenant see the updated library
5. **Given** a meal in the library, **When** a user updates the key ingredients list, **Then** the meal-ingredient relationships are updated correctly

---

### User Story 3 - Discover Meal Options with Random Selection (Priority: P3)

Users who are unsure what to cook need help choosing from eligible meals. The system can randomly select an appropriate meal from the eligible options for any given day and meal slot (lunch or dinner).

**Why this priority**: This is a convenience feature that enhances the planning experience but isn't required for basic functionality. Users can always manually browse and select meals.

**Independent Test**: Can be fully tested by requesting a random meal for a specific day/meal-type combination and verifying it meets eligibility criteria - works independently once the library and user settings exist.

**Acceptance Scenarios**:

1. **Given** a user has 10 meals in their library where 5 are eligible for Monday dinner, **When** they request a random eligible meal for Monday dinner, **Then** one of the 5 eligible meals is returned
2. **Given** a user requests a random meal for Wednesday lunch, **When** the eligible meals list contains 3 options, **Then** the returned meal matches Wednesday's lunch quality preferences
3. **Given** a user has no eligible meals for a specific day/meal combination, **When** they request a random meal, **Then** the system returns an empty result or appropriate message

---

### User Story 4 - Configure Personal Meal Preferences (Priority: P2)

Tenant administrators need to configure preferences that affect meal planning for all users in the tenant. This includes setting the week start day and defining quality preferences for each day of the week (e.g., "Monday dinner should be easy to make", "Wednesday lunch should have green vegetables").

**Why this priority**: Settings are essential for personalization and drive the eligibility filtering, but basic planning can work with default settings. This enables the smart filtering that makes P1 valuable.

**Independent Test**: Can be fully tested by a tenant admin updating settings (week start day, daily meal quality preferences) and verifying these settings affect meal eligibility and week structure - without needing to complete full meal plans.

**Acceptance Scenarios**:

1. **Given** a user with "isTenantAdmin = true", **When** they update the starting day to Saturday, **Then** all future planned weeks start on Saturday
2. **Given** a non-admin user, **When** they attempt to update user settings, **Then** the request is denied
3. **Given** a tenant admin sets Monday dinner preferences to "isEasyToMake = true", **When** any user views eligible meals for Monday dinner, **Then** only meals with "isEasyToMake = true" are shown
4. **Given** a tenant admin configures quality preferences for each day of the week, **When** the settings are saved, **Then** they apply to all users in the tenant

---

### Edge Cases

- ~~What happens when a user requests eligible meals but none exist in their library that match the day's quality criteria?~~ **RESOLVED**: System returns empty list; users can still manually assign any meal from their library (preferences are guidance, not restrictions)
- How does the system handle a planned week that spans a month boundary (e.g., starts on Jan 28)?
- ~~What happens when a user deletes a meal from the library that is currently assigned to a day in their planned week?~~ **RESOLVED**: Meals are soft-deleted (archived); they no longer appear in the active library but remain visible in planned weeks with archived status
- ~~How does the leftover auto-population work for the first day of the week (no previous day exists)?~~ **RESOLVED**: Auto-population is skipped for the first day of the week; lunch remains null (no cross-week leftover logic)
- What happens when a tenant has only one user and that user is not a tenant admin?
- How does the system handle timezone differences for date-only fields when users are in different locations?
- What happens when a user changes their starting day preference after already creating planned weeks?
- How does the system handle concurrent edits to the same meal by multiple users in a tenant?

## Requirements *(mandatory)*

### Functional Requirements

#### Meal Planning

- **FR-001**: System MUST create a planned week with exactly 7 consecutive day plans starting from the specified start date
- **FR-002**: System MUST calculate the long day name (Monday, Tuesday, etc.) and short day name (Mon, Tue, etc.) from the date when creating a day plan
- **FR-003**: System MUST allow users to assign a meal from their tenant's library to any lunch or dinner slot in a day plan
- **FR-004**: System MUST allow users to remove assigned meals from lunch or dinner slots
- **FR-005**: System MUST support null values for lunch and dinner slots (unplanned meals)
- **FR-006**: System MUST automatically populate a day's lunch with leftovers from the previous day's dinner when: (1) the previous day's dinner meal has "makesLunch = true", AND (2) the current day's lunch is null
- **FR-006a**: System MUST NOT apply leftover auto-population logic to the first day of the week (no cross-week leftover logic); the first day's lunch remains null unless manually assigned
- **FR-007**: System MUST retrieve eligible meals for a specific day and meal type (lunch or dinner) based on user settings quality preferences for that day; if no meals match preferences, system MUST return an empty list
- **FR-007a**: System MUST allow users to manually assign any meal from their library to any day/meal-type slot, regardless of whether the meal matches that day's quality preferences
- **FR-008**: System MUST provide an endpoint to randomly select one eligible meal from the eligible meals list for a given day and meal type
- **FR-009**: System MUST respect the week starting day configured in user settings when creating planned weeks
- **FR-010**: System MUST support three week starting day options: Monday (default), Saturday, and Sunday

#### Meal Library Management

- **FR-011**: System MUST allow users to create meals with: meal name, meal qualities, key ingredients list, optional recipe link, optional meal image ID, and creator user ID
- **FR-012**: System MUST store all meal quality attributes: isDinner (default true), isLunch (default false), isCreamy (default false), isAcidic (default false), greenVeg (default false), makesLunch (default false), isEasyToMake (default false), needsPrep (default false)
- **FR-013**: System MUST enforce mutual exclusivity: if isCreamy = true then isAcidic MUST be false, and vice versa
- **FR-014**: System MUST allow users to update any meal in their tenant's library
- **FR-015**: System MUST allow users to delete meals from their tenant's library
- **FR-015a**: System MUST implement soft deletion for meals (archive rather than hard delete); archived meals no longer appear in the active library or eligible meal lists
- **FR-015b**: System MUST retain archived meals in existing planned weeks with visible archived/deleted status indicator
- **FR-015c**: System MUST prevent archived meals from being assigned to new or existing meal slots in planned weeks
- **FR-016**: System MUST maintain a many-to-many relationship between meals and ingredients
- **FR-017**: System MUST store ingredient attributes: ingredient name, staple flag, and storage type
- **FR-018**: System MUST track which user created each meal (madeBy user ID)

#### Multi-Tenancy & Permissions

- **FR-019**: System MUST isolate each tenant's meal library - tenants can only access their own meals
- **FR-020**: System MUST allow all users within a tenant to view, create, edit, and delete meals in the tenant's shared meal library
- **FR-021**: System MUST restrict user settings updates to users where isTenantAdmin = true
- **FR-022**: System MUST allow non-admin users to view user settings but not modify them
- **FR-023**: System MUST associate each user with exactly one tenant
- **FR-024**: System MUST support multiple users per tenant
- **FR-025**: System MUST maintain one user settings configuration per tenant (shared by all users in that tenant)
- **FR-026**: System MUST maintain one meal library per tenant (shared by all users in that tenant)

#### User Management

- **FR-027**: System MUST store user attributes: unique user ID, email, nickname, tenant ID, and tenant admin flag
- **FR-028**: System MUST ensure user IDs are unique across all tenants
- **FR-029**: System MUST validate email format for user accounts
- **FR-030**: System MUST support the tenant admin flag to determine permission levels

### Key Entities

- **PlannedWeek**: Represents a 7-day meal plan starting from a specific date. Contains the starting date and an ordered collection of 7 day plans. The starting date's day-of-week must align with the user's configured week start day.

- **DayPlan**: Represents meal planning for a single day. Contains a specific date (date-only, no time), calculated day names (long: "Monday", short: "Mon"), and optional meal assignments for lunch and dinner. Day names are derived from the date, not supplied by users.

- **Meal**: Represents a vegan meal in the library. Contains meal name, quality attributes, relationships to key ingredients, optional recipe link (URL or string), optional image identifier, the ID of the user who created it, and archived status flag. Belongs to a tenant's meal library. Archived meals remain visible in historical planned weeks but cannot be used for new assignments.

- **MealQualities**: Represents the characteristics of a meal used for filtering and eligibility. Contains boolean flags: isDinner (default true), isLunch (default false), isCreamy, isAcidic (mutually exclusive with isCreamy), greenVeg, makesLunch, isEasyToMake, needsPrep. All flags except isDinner default to false.

- **Ingredient**: Represents a key ingredient used in meals. Contains ingredient name, staple flag (whether it's a pantry staple), and storage type classification (`Fridge`, `Pantry`, `Frozen`, or `Other`). Has many-to-many relationships with meals.

- **User**: Represents a person using the system. Contains unique user ID, email address, display nickname, tenant ID (foreign key), and tenant admin flag. Users belong to exactly one tenant and share that tenant's settings and meal library.

- **Tenant**: Represents an organization or household using the system. Has one user settings configuration and one meal library shared by all users. Contains multiple users, at least one of which should be a tenant admin.

- **UserSettings**: Tenant-level configuration for meal planning preferences. Contains week starting day preference (Monday, Saturday, or Sunday) and one quality preference set per day of the week (7 preference sets total). Each day's preferences are matched against meal qualities; meals must have isLunch=true for lunch slots or isDinner=true for dinner slots, plus any additional quality flags set in that day's preferences. Shared by all users in the tenant.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a complete 7-day meal plan in under 5 minutes
- **SC-002**: Users can add a new meal to their library in under 1 minute
- **SC-003**: System correctly auto-populates lunch with leftovers in 100% of cases where previous dinner has makesLunch = true and current lunch is null
- **SC-004**: Eligible meal filtering returns results in under 500 milliseconds for libraries containing up to 200 meals
- **SC-005**: Random meal selection provides statistically random distribution across eligible meals (verified over 1000+ requests)
- **SC-006**: Multi-tenant isolation prevents 100% of cross-tenant data access attempts
- **SC-007**: Tenant admin permission checks successfully block 100% of unauthorized setting update attempts by non-admin users
- **SC-008**: System handles concurrent meal library edits by multiple users in the same tenant without data loss or corruption
- **SC-009**: Week planning correctly handles all month and year boundaries (e.g., weeks spanning Dec 31 to Jan 6)

## Clarifications

### Session 2025-12-30

- Q: Storage Type Enumeration Values → A: `Fridge` | `Pantry` | `Frozen` | `Other`
- Q: Empty Eligible Meals Handling → A: Return empty list but allow manual assignment of any meal (ignore preferences)
- Q: Deleted Meal Handling in Planned Weeks → A: Allow deletion - archive meal (soft delete) so plans retain historical reference
- Q: Leftover Auto-Population for First Day of Week → A: Skip auto-population - lunch remains null (boundary case exception)
- Q: UserSettings Daily Quality Preferences Structure → A: No separate lunch settings, just add isLunch to MealQualities

## Assumptions

- Recipe links are stored as strings to support various URL formats; validation of URL format is not enforced at this stage
- Image storage is external (CDN); the system only stores image identifiers as strings
- Storage type for ingredients uses enumeration values: `Fridge`, `Pantry`, `Frozen`, `Other`
- Email validation uses standard email format rules (contains @, domain structure)
- Date-only fields use ISO date format (YYYY-MM-DD) without time or timezone components
- Timezone handling for dates will be addressed in a future feature; current assumption is dates are treated as local to the user
- User settings contain one quality preference set per day of the week (7 total); meals are filtered by isLunch/isDinner flag plus the day's quality preferences (e.g., "Monday should be easy to make" = Monday preferences include isEasyToMake=true, applied to both lunch and dinner)
- "Eligible meals" for a day/meal-type means meals where: (1) the meal has the appropriate isLunch or isDinner flag set to true, AND (2) ALL quality flags set to true in the day's preferences are also true in the meal's qualities (AND logic, not OR)
- Quality preferences act as filtering guidance for eligible meal suggestions, but users can manually assign any meal from their library regardless of preference matching
- Meals use soft deletion (archival): deleted meals are flagged as archived rather than removed from the database, allowing planned weeks to retain historical references while preventing future use
- Leftover auto-population only applies within a single week; the first day of each week has no auto-population logic applied (week boundaries are natural reset points)
- Leftover auto-population creates a reference or copy of the previous day's dinner meal in the lunch slot (implementation detail to be determined in planning)
- The system supports standard REST API patterns for CRUD operations on all entities
- Authentication and authorization mechanisms exist but are not detailed in this specification (assumed to be handled by existing infrastructure)
- Each tenant starts with at least one user who is a tenant admin
- User registration and tenant creation flows are not covered in this specification (assumed to exist or be handled separately)

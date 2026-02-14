# Tasks: User Authentication and Registration

**Input**: Design documents from `/specs/003-user-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: Tests are included following test-first development approach per constitution.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, dependency installation, and basic structure

- [X] T001 Install authentication dependencies (bcrypt, jsonwebtoken, nodemailer, rate-limiter-flexible) via bun add in package.json
- [X] T002 [P] Add environment variables for JWT_SECRET, SMTP configuration, and rate limiting to .env.example
- [X] T003 [P] Create src/domain/auth directory structure per plan.md
- [X] T004 [P] Create src/infrastructure/auth directory structure per plan.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

**Note on Test-First**: Foundational infrastructure tasks (T005-T018) create shared infrastructure that user story tests depend on. Unit tests for foundational components are written as integration tests in Phase 3+ user stories, as they require the infrastructure to exist. This aligns with constitution test-first principle: user story tests are written first before user story implementation.

- [X] T005 Update Prisma schema.prisma to add passwordHash field to User model and create PasswordResetToken model per data-model.md
- [X] T006 Create Prisma migration for authentication schema changes in prisma/migrations/[timestamp]_add_auth_tables/migration.sql
- [X] T007 [P] Create AuthProvider interface in src/domain/auth/auth-provider.interface.ts for extensible authentication strategy pattern
- [X] T008 [P] Create AuthToken entity type in src/domain/auth/auth-token.entity.ts representing JWT token domain model
- [X] T009 [P] Create PasswordResetToken entity type in src/domain/auth/password-reset-token.entity.ts representing reset token domain model
- [X] T010 [P] Create UserCredentials entity type in src/domain/auth/user-credentials.entity.ts for email/password credentials
- [X] T011 [P] Create AuthRepository interface in src/domain/auth/auth.repository.ts for authentication data operations
- [X] T012 [P] Implement BcryptPasswordHasher service in src/infrastructure/auth/password/bcrypt-password-hasher.ts with cost factor 10
- [X] T013 [P] Implement JWTGenerator service in src/infrastructure/auth/jwt/jwt-generator.ts for token creation with 24h expiration
- [X] T014 [P] Implement JWTValidator service in src/infrastructure/auth/jwt/jwt-validator.ts for token validation
- [X] T015 [P] Implement RateLimiterService in src/infrastructure/auth/rate-limiting/rate-limiter.service.ts with 3 attempts per 10 minutes per IP
- [X] T016 [P] Implement EmailService in src/infrastructure/auth/email/email.service.ts using nodemailer for password reset emails
- [X] T017 Create PrismaAuthRepository implementation in src/infrastructure/database/repositories/prisma-auth.repository.ts implementing AuthRepository interface
- [X] T018 Extend PrismaUserRepository in src/infrastructure/database/repositories/prisma-user.repository.ts with password-related methods (findByEmailWithPassword, updatePasswordHash)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Register New Account (Priority: P1) 🎯 MVP

**Goal**: Users can register with email, password, nickname, and tenant name. System creates account, tenant, assigns user as admin, and returns authentication token.

**Independent Test**: Can be fully tested by submitting registration information, verifying account creation, and confirming the user can authenticate with their credentials - all without requiring other system features.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [X] T019 [P] [US1] Create unit test for RegisterUserUseCase in tests/unit/application/auth/register-user.use-case.spec.ts
- [X] T020 [P] [US1] Create unit test for EmailPasswordAuthProvider in tests/unit/infrastructure/auth/providers/email-password-auth.provider.spec.ts
- [X] T021 [P] [US1] Create integration test for registration flow in tests/integration/repositories/auth.repository.integration.spec.ts
- [X] T022 [P] [US1] Create e2e test for POST /auth/register endpoint in tests/e2e/auth.e2e.spec.ts

### Implementation for User Story 1

- [X] T023 [P] [US1] Create RegisterUserUseCase in src/application/auth/register-user.use-case.ts with email/password/nickname/tenantName validation
- [X] T024 [US1] Implement EmailPasswordAuthProvider in src/infrastructure/auth/providers/email-password-auth.provider.ts implementing AuthProvider interface
- [X] T025 [US1] Add password validation utility function in src/infrastructure/auth/password/password-validator.ts (minimum 8 chars, letter + number)
- [X] T026 [US1] Add email validation utility function in src/infrastructure/auth/email/email-validator.ts
- [X] T027 [US1] Add nickname validation utility function in src/infrastructure/auth/profile/nickname-validator.ts (1-50 characters)
- [X] T028 [US1] Implement tenant creation logic in RegisterUserUseCase (create tenant, assign user as admin)
- [X] T029 [US1] Implement password hashing in RegisterUserUseCase using BcryptPasswordHasher
- [X] T030 [US1] Implement JWT token generation in RegisterUserUseCase using JWTGenerator (include userId, tenantId, email)
- [X] T031 [US1] Create AuthController in src/infrastructure/http/controllers/auth.controller.ts with register method
- [X] T032 [US1] Add POST /auth/register route in src/infrastructure/http/routes/index.ts
- [X] T033 [US1] Register RegisterUserUseCase, EmailPasswordAuthProvider, and AuthController in DI container in src/infrastructure/di/setup.ts
- [X] T034 [US1] Add request validation DTOs for registration in src/infrastructure/http/dtos/auth.dto.ts (RegisterRequest, AuthResponse)
- [X] T035 [US1] Add error handling for duplicate email (409 Conflict) in AuthController
- [X] T036 [US1] Add error handling for validation errors (400 Bad Request) in AuthController

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently. Users can register and receive authentication tokens.

---

## Phase 4: User Story 2 - Authenticate and Access System (Priority: P1)

**Goal**: Users can log in with email/password and receive JWT token. Token can be used to access protected endpoints. Rate limiting prevents brute force attacks.

**Independent Test**: Can be fully tested by providing valid credentials, receiving an authentication token, and using that token to access a protected endpoint - independent of other features.

### Tests for User Story 2

- [X] T037 [P] [US2] Create unit test for AuthenticateUserUseCase in tests/unit/application/auth/authenticate-user.use-case.spec.ts
- [X] T038 [P] [US2] Create unit test for auth middleware in tests/unit/infrastructure/http/middleware/auth.middleware.spec.ts
- [X] T039 [P] [US2] Create e2e test for POST /auth/login endpoint in tests/e2e/auth.e2e.spec.ts
- [X] T040 [P] [US2] Create e2e test for protected endpoint access with valid token in tests/e2e/auth.e2e.spec.ts
- [X] T041 [P] [US2] Create e2e test for protected endpoint access with invalid token in tests/e2e/auth.e2e.spec.ts

### Implementation for User Story 2

- [X] T042 [P] [US2] Create AuthenticateUserUseCase in src/application/auth/authenticate-user.use-case.ts with email/password authentication
- [X] T043 [US2] Implement password verification in AuthenticateUserUseCase using BcryptPasswordHasher.compare()
- [X] T044 [US2] Implement generic error message in AuthenticateUserUseCase (don't reveal if email exists per FR-014)
- [X] T045 [US2] Implement JWT token generation in AuthenticateUserUseCase using JWTGenerator (24h expiration)
- [X] T046 [US2] Update auth middleware in src/infrastructure/http/middleware/auth.middleware.ts to validate JWT tokens using JWTValidator
- [X] T047 [US2] Extract userId and tenantId from JWT token in auth middleware and add to HttpContext
- [X] T048 [US2] Create rate limit middleware in src/infrastructure/http/middleware/rate-limit.middleware.ts using RateLimiterService (3 attempts per 10 minutes per IP)
- [X] T049 [US2] Add login method to AuthController in src/infrastructure/http/controllers/auth.controller.ts
- [X] T050 [US2] Add POST /auth/login route in src/infrastructure/http/routes/index.ts with rate limiting middleware
- [X] T051 [US2] Register AuthenticateUserUseCase in DI container in src/infrastructure/di/setup.ts
- [X] T052 [US2] Add LoginRequest DTO in src/infrastructure/http/dtos/auth.dto.ts
- [X] T053 [US2] Apply auth middleware to existing protected endpoints (meals, planned-weeks, etc.) in src/infrastructure/http/routes/index.ts
- [X] T054 [US2] Update tenant isolation middleware in src/infrastructure/http/middleware/tenant-isolation.middleware.ts to use tenantId from authenticated context

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently. Users can register, login, and access protected endpoints with tokens.

---

## Phase 5: User Story 3 - Manage Password (Priority: P2)

**Goal**: Users can change their password (requires current password) and reset forgotten passwords via email. Password reset tokens expire after 1 hour and are single-use.

**Independent Test**: Can be fully tested by initiating password reset, verifying email is sent, completing reset flow, and then successfully logging in with the new password - independent of other features.

### Tests for User Story 3

- [X] T055 [P] [US3] Create unit test for ChangePasswordUseCase in tests/unit/application/auth/change-password.use-case.spec.ts
- [X] T056 [P] [US3] Create unit test for RequestPasswordResetUseCase in tests/unit/application/auth/request-password-reset.use-case.spec.ts
- [X] T057 [P] [US3] Create unit test for ResetPasswordUseCase in tests/unit/application/auth/reset-password.use-case.spec.ts
- [X] T058 [P] [US3] Create integration test for password reset flow in tests/integration/repositories/auth.repository.integration.spec.ts
- [X] T059 [P] [US3] Create e2e test for POST /auth/password/change endpoint in tests/e2e/auth.e2e.spec.ts
- [X] T060 [P] [US3] Create e2e test for POST /auth/password/reset/request endpoint in tests/e2e/auth.e2e.spec.ts
- [X] T061 [P] [US3] Create e2e test for POST /auth/password/reset endpoint in tests/e2e/auth.e2e.spec.ts

### Implementation for User Story 3

- [X] T062 [P] [US3] Create ChangePasswordUseCase in src/application/auth/change-password.use-case.ts requiring current password verification
- [X] T063 [P] [US3] Create RequestPasswordResetUseCase in src/application/auth/request-password-reset.use-case.ts for generating reset tokens
- [X] T064 [P] [US3] Create ResetPasswordUseCase in src/application/auth/reset-password.use-case.ts for completing password reset
- [X] T065 [US3] Implement cryptographically random token generation in RequestPasswordResetUseCase (32+ bytes)
- [X] T066 [US3] Implement password reset token creation in PrismaAuthRepository with 1 hour expiration
- [X] T067 [US3] Implement password reset token lookup in PrismaAuthRepository (find valid, unused, non-expired token)
- [X] T068 [US3] Implement password reset token invalidation in ResetPasswordUseCase (mark usedAt timestamp)
- [X] T069 [US3] Implement password reset email template in src/infrastructure/auth/email/password-reset-email.template.ts
- [X] T070 [US3] Implement password reset email sending in RequestPasswordResetUseCase using EmailService
- [X] T071 [US3] Add password change method to AuthController in src/infrastructure/http/controllers/auth.controller.ts
- [X] T072 [US3] Add password reset request method to AuthController in src/infrastructure/http/controllers/auth.controller.ts
- [X] T073 [US3] Add password reset completion method to AuthController in src/infrastructure/http/controllers/auth.controller.ts
- [X] T074 [US3] Add POST /auth/password/change route in src/infrastructure/http/routes/index.ts (protected endpoint)
- [X] T075 [US3] Add POST /auth/password/reset/request route in src/infrastructure/http/routes/index.ts with rate limiting middleware
- [X] T076 [US3] Add POST /auth/password/reset route in src/infrastructure/http/routes/index.ts
- [X] T077 [US3] Register password management use cases in DI container in src/infrastructure/di/setup.ts
- [X] T078 [US3] Add password management DTOs in src/infrastructure/http/dtos/auth.dto.ts (ChangePasswordRequest, PasswordResetRequest, ResetPasswordRequest)
- [X] T079 [US3] Add generic success message for password reset request (don't reveal if email exists) in AuthController
- [X] T080 [US3] Add error handling for expired/invalid reset tokens (401 Unauthorized) in AuthController

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently. Users can register, login, change passwords, and reset forgotten passwords.

---

## Phase 6: User Story 4 - View and Update Profile (Priority: P3)

**Goal**: Users can view their profile information and update their nickname. Email is immutable and cannot be changed.

**Independent Test**: Can be fully tested by retrieving user profile information and updating profile fields - independent of other features.

### Tests for User Story 4

- [X] T081 [P] [US4] Create unit test for GetUserProfileUseCase in tests/unit/application/auth/get-user-profile.use-case.spec.ts
- [X] T082 [P] [US4] Create unit test for UpdateUserProfileUseCase in tests/unit/application/auth/update-user-profile.use-case.spec.ts
- [X] T083 [P] [US4] Create e2e test for GET /auth/profile endpoint in tests/e2e/auth.e2e.spec.ts
- [X] T084 [P] [US4] Create e2e test for PATCH /auth/profile endpoint in tests/e2e/auth.e2e.spec.ts

### Implementation for User Story 4

- [X] T085 [P] [US4] Create GetUserProfileUseCase in src/application/auth/get-user-profile.use-case.ts to retrieve user profile
- [X] T086 [P] [US4] Create UpdateUserProfileUseCase in src/application/auth/update-user-profile.use-case.ts for nickname updates only
- [X] T087 [US4] Implement email immutability check in UpdateUserProfileUseCase (prevent email changes per FR-027)
- [X] T088 [US4] Add getProfile method to AuthController in src/infrastructure/http/controllers/auth.controller.ts
- [X] T089 [US4] Add updateProfile method to AuthController in src/infrastructure/http/controllers/auth.controller.ts
- [X] T090 [US4] Add GET /auth/profile route in src/infrastructure/http/routes/index.ts (protected endpoint)
- [X] T091 [US4] Add PATCH /auth/profile route in src/infrastructure/http/routes/index.ts (protected endpoint)
- [X] T092 [US4] Register profile management use cases in DI container in src/infrastructure/di/setup.ts
- [X] T093 [US4] Add profile DTOs in src/infrastructure/http/dtos/auth.dto.ts (UserProfile, UpdateProfileRequest)
- [X] T094 [US4] Add error handling for email update attempts (400 Bad Request) in AuthController

**Checkpoint**: At this point, all user stories should be independently functional. Users can register, login, manage passwords, and view/update profiles.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T095 [P] Add authentication event logging (successful logins, failed attempts, password changes) in src/infrastructure/auth/logging/auth-event-logger.ts
- [ ] T096 [P] Implement input sanitization for all authentication endpoints in src/infrastructure/http/middleware/validation.middleware.ts
- [ ] T097 [P] Add comprehensive error handling for authentication edge cases (concurrent logins, malformed tokens, etc.)
- [X] T098 [P] Update README.md with authentication endpoints documentation
- [ ] T099 [P] Add authentication examples to quickstart.md validation
- [X] T100 [P] Run code quality checks (bun run check) and fix any linting/formatting issues
- [ ] T101 [P] Add unit test coverage for authentication domain entities in tests/unit/domain/auth/
- [ ] T102 [P] Add integration tests for email service mocking in tests/integration/infrastructure/auth/
- [X] T103 [P] Verify all acceptance scenarios from spec.md are covered by tests
- [X] T104 [P] Add JSDoc comments to all authentication use cases and services
- [ ] T105 [P] Create cleanup job for expired password reset tokens (optional scheduled task)
- [ ] T106 [P] Add performance/load testing for authentication endpoints to validate SC-005 (1000 concurrent requests) in tests/performance/auth-load.spec.ts

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - Depends on User Story 1 for registration flow, but login can be tested independently
- **User Story 3 (P2)**: Can start after Foundational (Phase 2) - Depends on User Story 1 (registration) and User Story 2 (authentication) for authenticated password change
- **User Story 4 (P3)**: Can start after Foundational (Phase 2) - Depends on User Story 2 (authentication) for protected profile endpoints

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Domain entities/interfaces before use cases
- Use cases before controllers
- Controllers before routes
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel (if team capacity allows)
- All tests for a user story marked [P] can run in parallel
- Domain entities within a story marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task T019: "Create unit test for RegisterUserUseCase in tests/unit/application/auth/register-user.use-case.spec.ts"
Task T020: "Create unit test for EmailPasswordAuthProvider in tests/unit/infrastructure/auth/providers/email-password-auth.provider.spec.ts"
Task T021: "Create integration test for registration flow in tests/integration/repositories/auth.repository.integration.spec.ts"
Task T022: "Create e2e test for POST /auth/register endpoint in tests/e2e/auth.e2e.spec.ts"

# Launch domain entities together:
Task T007: "Create AuthProvider interface in src/domain/auth/auth-provider.interface.ts"
Task T008: "Create AuthToken entity type in src/domain/auth/auth-token.entity.ts"
Task T009: "Create PasswordResetToken entity type in src/domain/auth/password-reset-token.entity.ts"
Task T010: "Create UserCredentials entity type in src/domain/auth/user-credentials.entity.ts"
Task T011: "Create AuthRepository interface in src/domain/auth/auth.repository.ts"
```

---

## Parallel Example: User Story 2

```bash
# Launch infrastructure services together:
Task T012: "Implement BcryptPasswordHasher service in src/infrastructure/auth/password/bcrypt-password-hasher.ts"
Task T013: "Implement JWTGenerator service in src/infrastructure/auth/jwt/jwt-generator.ts"
Task T014: "Implement JWTValidator service in src/infrastructure/auth/jwt/jwt-validator.ts"
Task T015: "Implement RateLimiterService in src/infrastructure/auth/rate-limiting/rate-limiter.service.ts"
Task T016: "Implement EmailService in src/infrastructure/auth/email/email.service.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Registration)
4. Complete Phase 4: User Story 2 (Authentication)
5. **STOP and VALIDATE**: Test User Stories 1 & 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Registration MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo (Full Auth MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo (Password Management)
5. Add User Story 4 → Test independently → Deploy/Demo (Profile Management)
6. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Registration)
   - Developer B: User Story 2 (Authentication) - can start after T023-T033 complete
   - Developer C: User Story 3 (Password Management) - can start after User Stories 1 & 2 complete
   - Developer D: User Story 4 (Profile Management) - can start after User Story 2 complete
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Password reset email delivery requires SMTP configuration in environment variables
- Rate limiting uses in-memory store (can be extended to Redis later for distributed systems)

---

## Task Summary

**Total Tasks**: 106

**Tasks per Phase**:
- Phase 1 (Setup): 4 tasks
- Phase 2 (Foundational): 14 tasks
- Phase 3 (User Story 1): 18 tasks (4 tests + 14 implementation)
- Phase 4 (User Story 2): 18 tasks (5 tests + 13 implementation)
- Phase 5 (User Story 3): 26 tasks (7 tests + 19 implementation)
- Phase 6 (User Story 4): 14 tasks (4 tests + 10 implementation)
- Phase 7 (Polish): 12 tasks

**Tasks per User Story**:
- User Story 1 (P1): 18 tasks
- User Story 2 (P1): 18 tasks
- User Story 3 (P2): 26 tasks
- User Story 4 (P3): 14 tasks

**Parallel Opportunities Identified**: 
- 4 tasks in Setup phase
- 10 tasks in Foundational phase
- 4 test tasks per user story
- Multiple domain entity tasks can run in parallel

**Independent Test Criteria**:
- **US1**: Submit registration, verify account creation, confirm authentication works
- **US2**: Provide credentials, receive token, use token to access protected endpoint
- **US3**: Initiate password reset, verify email sent, complete reset, login with new password
- **US4**: Retrieve profile information, update nickname, verify changes

**Suggested MVP Scope**: User Stories 1 & 2 (Registration + Authentication) - 36 tasks total, provides complete authentication flow

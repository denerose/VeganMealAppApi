# Research & Technical Decisions

**Feature**: Vegan Meal Planning API  
**Created**: 30 December 2025  
**Purpose**: Document research findings and technical decisions for implementation planning

## Technology Stack Decisions

### Runtime & Language

**Decision**: Bun + TypeScript

**Rationale**:
- Bun provides significantly faster JavaScript runtime than Node.js (startup, execution, package install)
- Built-in TypeScript support without additional transpilation step
- Native test runner eliminates need for external testing frameworks
- Bundles, transpiles, and runs TypeScript directly
- Drop-in Node.js replacement with better performance

**Key Configuration**:
- Use `bun init` to scaffold project with optimal `tsconfig.json`
- TypeScript compiler options for Bun projects:
  - `target: "ESNext"` and `module: "Preserve"` for latest features
  - `moduleResolution: "bundler"` for Bun's bundler mode
  - `allowImportingTsExtensions: true` for `.ts` imports
  - `strict: true` for maximum type safety
  - `noEmit: true` since Bun handles transpilation

**Reference**: [Bun TypeScript Configuration](https://bun.sh/docs/runtime/typescript)

---

### ORM & Database

**Decision**: Prisma + PostgreSQL

**Rationale**:
- Type-safe database client with auto-generated types from schema
- Declarative schema language (Prisma Schema Language)
- Built-in migration system for version-controlled schema changes
- Excellent PostgreSQL support with all modern features
- Multi-schema support for potential domain separation

**Multi-Tenancy Strategy**: Row-Level Tenant Isolation

**Pattern**:
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  tenantId  String   
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  // ... other fields
  
  @@index([tenantId])
}

model Meal {
  id        String   @id @default(uuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  // ... other fields
  
  @@index([tenantId])
}
```

**Implementation Approach**:
- Every tenant-scoped model includes `tenantId` foreign key
- Index on `tenantId` for performant filtering
- Middleware/service layer enforces tenant filtering on all queries
- Soft deletes via `deletedAt` timestamp (nullable DateTime)
- Audit fields: `createdAt`, `updatedAt`, `createdBy` (userId)

**Reference**: [Prisma Multi-Schema Docs](https://www.prisma.io/docs/orm/prisma-schema/data-model/multi-schema)

---

### Date Handling

**Decision**: date-fns (v3.5.0+)

**Rationale**:
- Immutable, functional approach to date manipulation
- Tree-shakeable (import only what you need)
- No timezone database bundled (smaller bundle size)
- Works with native JavaScript Date objects
- Strong TypeScript support

**Key Functions for This Project**:
```typescript
import { 
  format,           // Format dates as 'yyyy-MM-dd'
  addDays,          // Add days for week generation
  startOfWeek,      // Calculate week start from any day
  getDay,           // Get day of week (0-6)
  parseISO,         // Parse ISO date strings
  compareAsc,       // Sort dates
  differenceInDays  // Calculate day difference
} from 'date-fns';

// Date-only handling (no time component)
const dateOnly = format(new Date(), 'yyyy-MM-dd'); // "2025-12-30"
```

**Week Day Calculation**:
```typescript
// Map numeric day (0-6) to long/short day names
const LONG_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getDayNames(date: Date) {
  const dayIndex = getDay(date);
  return {
    longDay: LONG_DAYS[dayIndex],
    shortDay: SHORT_DAYS[dayIndex]
  };
}
```

**Reference**: [date-fns Getting Started](https://date-fns.org/docs/Getting-Started)

---

### API Specification & Documentation

**Decision**: OpenAPI 3.0 + Postman Import

**Rationale**:
- Industry-standard API specification format
- Postman natively imports OpenAPI specs
- Can generate TypeScript types from spec
- Enables contract-first development
- Supports code generation for clients

**Structure**:
```yaml
openapi: 3.0.0
info:
  title: Vegan Meal Planning API
  version: 1.0.0
servers:
  - url: http://localhost:3000/api/v1
paths:
  /planned-weeks:
    get: # List planned weeks
    post: # Create new planned week
  /planned-weeks/{weekId}:
    get: # Get specific week
    put: # Update week
  /meals:
    get: # List meals with filtering
    post: # Create meal
  /meals/{mealId}:
    get: # Get meal
    put: # Update meal
    delete: # Soft delete meal
  /meals/eligible:
    get: # Get eligible meals for day/meal-type
  /meals/random:
    get: # Get random eligible meal
  /user-settings:
    get: # Get tenant settings
    put: # Update settings (admin only)
components:
  schemas: # All entity DTOs
  securitySchemes: # Auth (JWT assumed)
```

**Location**: `/specs/001-001-meal-planning-api/contracts/openapi.yaml`

---

### Code Quality & Formatting

**Decision**: ESLint + Prettier

**ESLint Configuration**:
```json
{
  "parser": "@typescript-eslint/parser",
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "prettier" // Disables ESLint formatting rules that conflict with Prettier
  ],
  "rules": {
    "@typescript-eslint/explicit-function-return-type": "warn",
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**Prettier Configuration**:
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "arrowParens": "avoid"
}
```

**Integration**:
- Run ESLint before commits (via husky + lint-staged)
- Prettier formats on save (IDE integration)
- Both run in CI pipeline

---

### Local Development Environment

**Decision**: Docker Compose for PostgreSQL

**Rationale**:
- Consistent development environment across machines
- Easy start/stop without installing PostgreSQL globally
- Matches production PostgreSQL version
- Isolated from other projects

**Docker Compose Configuration**:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: vegan-meal-api-db
    environment:
      POSTGRES_USER: vegan_meal_user
      POSTGRES_PASSWORD: local_dev_password
      POSTGRES_DB: vegan_meal_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vegan_meal_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

**Environment Variables** (`.env`):
```bash
DATABASE_URL="postgresql://vegan_meal_user:local_dev_password@localhost:5432/vegan_meal_db"
NODE_ENV="development"
PORT=3000
```

---

## Architecture Decisions

### Clean Architecture Layer Structure

```
src/
├── domain/              # Business logic (framework-agnostic)
│   ├── entities/        # Domain models (PlannedWeek, Meal, etc.)
│   ├── value-objects/   # Immutable values (MealQualities, StorageType)
│   ├── repositories/    # Repository interfaces (abstractions)
│   └── services/        # Business logic services
├── application/         # Use cases (orchestration)
│   ├── use-cases/       # Application-specific business rules
│   └── dtos/            # Data transfer objects
├── infrastructure/      # External dependencies
│   ├── database/        # Prisma client, repositories implementation
│   ├── http/            # Bun HTTP server, routes
│   └── config/          # Configuration loading
└── main.ts              # Composition root (dependency wiring)
```

**Dependency Rule**: 
- `domain` → depends on nothing
- `application` → depends on `domain` only
- `infrastructure` → depends on `domain` and `application`
- `main.ts` → wires everything together

---

### Repository Pattern Implementation

**Interface** (in `domain/repositories`):
```typescript
export interface MealRepository {
  findById(id: string, tenantId: string): Promise<Meal | null>;
  findAll(tenantId: string, filters?: MealFilters): Promise<Meal[]>;
  findEligible(tenantId: string, dayPreferences: QualityPreferences, isLunch: boolean): Promise<Meal[]>;
  save(meal: Meal, tenantId: string): Promise<Meal>;
  softDelete(id: string, tenantId: string): Promise<void>;
}
```

**Implementation** (in `infrastructure/database/repositories`):
```typescript
export class PrismaMealRepository implements MealRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string, tenantId: string): Promise<Meal | null> {
    const meal = await this.prisma.meal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: { ingredients: true }
    });
    return meal ? this.toDomain(meal) : null;
  }
  
  // ... other methods
}
```

---

### Dependency Injection Strategy

**Use Constructor Injection**:
```typescript
// ❌ Bad - hidden dependencies
class CreateMealUseCase {
  execute(data: CreateMealDto) {
    const repo = new PrismaMealRepository(); // Hidden dependency!
    // ...
  }
}

// ✅ Good - explicit dependencies
class CreateMealUseCase {
  constructor(private mealRepository: MealRepository) {}
  
  execute(data: CreateMealDto) {
    return this.mealRepository.save(data);
  }
}
```

**Composition Root** (`main.ts`):
```typescript
// Wire dependencies at startup
const prisma = new PrismaClient();
const mealRepository = new PrismaMealRepository(prisma);
const createMealUseCase = new CreateMealUseCase(mealRepository);

// Inject into HTTP handlers
const mealController = new MealController(createMealUseCase, ...);
```

---

### Testing Strategy

**Test Pyramid**:
1. **Unit Tests** (80% of tests)
   - Test domain logic in isolation
   - Mock repository interfaces
   - Fast (<30 seconds total)
   - Use Bun's built-in test runner

2. **Integration Tests** (15% of tests)
   - Test use cases with real database
   - Use test database (Docker Compose with different port)
   - Seed data before each test suite
   - Clean up after tests

3. **API Tests** (5% of tests)
   - Test full HTTP request/response cycle
   - Verify OpenAPI contract compliance
   - Test authentication/authorization

**Example Unit Test** (Bun test runner):
```typescript
import { describe, expect, test } from 'bun:test';
import { GeneratePlannedWeekUseCase } from './generate-planned-week';
import { MockUserSettingsRepository } from '../test/mocks';

describe('GeneratePlannedWeekUseCase', () => {
  test('generates 7 day plans starting from Monday', async () => {
    const mockRepo = new MockUserSettingsRepository();
    mockRepo.setWeekStartDay('Monday');
    
    const useCase = new GeneratePlannedWeekUseCase(mockRepo);
    const week = await useCase.execute({ 
      tenantId: 'test-tenant',
      startDate: '2025-01-06' 
    });
    
    expect(week.dayPlans).toHaveLength(7);
    expect(week.dayPlans[0].longDay).toBe('Monday');
    expect(week.dayPlans[0].date).toBe('2025-01-06');
  });
});
```

---

## Unknowns Resolved

### 1. Date-Only Handling Strategy

**Question**: How to represent date-only values (no time component) in TypeScript and PostgreSQL?

**Decision**:
- **Database**: Use PostgreSQL `DATE` type (Prisma: `@db.Date`)
- **Application**: Store as ISO date string `'yyyy-MM-dd'` in domain models
- **Parsing**: Use `date-fns.parseISO()` to convert to Date when needed for calculations
- **Formatting**: Use `date-fns.format(date, 'yyyy-MM-dd')` to convert Date back to string

**Rationale**: Strings avoid timezone confusion; DATE type in DB ensures no time component; date-fns handles conversions safely.

---

### 2. Leftover Auto-Population Implementation

**Question**: Should leftover meals be copied or referenced?

**Decision**: **Reference** (foreign key to original meal)

**Rationale**:
- If meal is edited, changes reflect in leftover slots automatically
- If meal is soft-deleted, leftover shows archived status
- Simpler data model (no duplicate meal data)
- Clear audit trail (leftover points to source meal)

**Schema**:
```prisma
model DayPlan {
  id              String   @id @default(uuid())
  date            DateTime @db.Date
  lunchMealId     String?
  lunchMeal       Meal?    @relation("LunchMeals", fields: [lunchMealId], references: [id])
  dinnerMealId    String?
  dinnerMeal      Meal?    @relation("DinnerMeals", fields: [dinnerMealId], references: [id])
  isLeftover      Boolean  @default(false) // Flag to indicate this lunch is a leftover
  // ...
}
```

---

### 3. Quality Preferences Storage Structure

**Question**: How to store 7 days × quality preferences in UserSettings?

**Decision**: **JSON/JSONB Column** with typed structure

**Schema**:
```prisma
model UserSettings {
  id              String   @id @default(uuid())
  tenantId        String   @unique
  weekStartDay    WeekStartDay @default(MONDAY)
  dailyPreferences Json    // Typed as DailyPreferences[] in application
  // ...
}

enum WeekStartDay {
  MONDAY
  SATURDAY
  SUNDAY
}
```

**Application Type**:
```typescript
type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type QualityPreferences = {
  isCreamy?: boolean;
  isAcidic?: boolean;
  greenVeg?: boolean;
  isEasyToMake?: boolean;
  needsPrep?: boolean;
};

type DailyPreferences = {
  day: DayOfWeek;
  preferences: QualityPreferences;
};

// UserSettings.dailyPreferences is DailyPreferences[]
```

**Rationale**: JSONB is flexible, queryable, and avoids 7 separate preference columns. Type safety maintained in application layer.

---

### 4. Eligible Meals Filtering Logic

**Question**: How to efficiently query meals matching quality preferences?

**Decision**: **Application-level filtering** (fetch active meals, filter in code)

**Rationale**:
- Quality flags are boolean columns - easy to fetch all active meals
- Filtering logic (AND operation on quality flags) is simple in TypeScript
- Avoids complex dynamic SQL generation
- Cache-friendly (can cache active meals, filter on each request)
- Typical meal libraries are <200 meals (per spec), so performance is acceptable

**Implementation**:
```typescript
async findEligible(
  tenantId: string, 
  preferences: QualityPreferences, 
  isLunch: boolean
): Promise<Meal[]> {
  // Fetch all active meals for tenant with correct lunch/dinner flag
  const meals = await this.prisma.meal.findMany({
    where: {
      tenantId,
      deletedAt: null,
      qualities: isLunch 
        ? { isLunch: true } 
        : { isDinner: true }
    },
    include: { qualities: true }
  });
  
  // Filter in application
  return meals.filter(meal => 
    this.matchesPreferences(meal.qualities, preferences)
  );
}

private matchesPreferences(
  mealQualities: MealQualities, 
  preferences: QualityPreferences
): boolean {
  // ALL quality flags in preferences must match meal qualities (AND logic)
  return Object.entries(preferences).every(([key, value]) => {
    if (!value) return true; // Preference not set, don't filter
    return mealQualities[key] === value;
  });
}
```

---

## Best Practices Summary

### 1. Vegan-First Examples (Constitution Requirement)

**All test data, examples, and documentation MUST use vegan meals**:
- ✅ "Lentil Curry", "Tofu Scramble", "Cashew Alfredo", "Chickpea Tacos"
- ✅ Ingredients: "Tofu", "Nutritional Yeast", "Cashews", "Lentils", "Chickpeas"
- ❌ No: "Chicken Curry", "Scrambled Eggs", "Cheese Pasta", "Beef Tacos"

### 2. Error Handling

- Use custom error classes extending `Error`
- Domain errors: `MealNotFoundError`, `UnauthorizedTenantAccessError`
- Infrastructure errors: `DatabaseConnectionError`, `ValidationError`
- Return errors via Result/Either pattern (avoid throwing in domain)

### 3. Logging

- Use structured logging (JSON format)
- Include `tenantId`, `userId`, `requestId` in all logs
- Log levels: ERROR (failures), WARN (recoverable issues), INFO (key events), DEBUG (detailed flow)

### 4. API Versioning

- URL-based versioning: `/api/v1/meals`
- Version in OpenAPI spec
- Plan for v2 from day 1 (breaking changes go in new version)

---

## Technology Versions

| Technology | Version | Rationale |
|------------|---------|-----------|
| Bun | Latest (1.2.3+) | Fast iteration, latest features |
| TypeScript | 5.3+ | Latest type system improvements |
| Prisma | 5.x | Stable, production-ready |
| PostgreSQL | 16 | Latest stable, excellent performance |
| date-fns | 3.5.0+ | Latest with improved tree-shaking |
| ESLint | 8.x | Standard linting |
| Prettier | 3.x | Standard formatting |

---

## Next Steps

With research complete, proceed to:
1. **Phase 1: Data Model Design** - Create detailed Prisma schema
2. **Phase 1: API Contracts** - Define OpenAPI specification
3. **Phase 1: Quickstart Guide** - Document local setup process
4. **Phase 1: Update Agent Context** - Record technology choices for future reference

---

**Research Completed**: 30 December 2025  
**Status**: ✅ All unknowns resolved, ready for Phase 1

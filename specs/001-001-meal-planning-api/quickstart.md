# Vegan Meal Planning API - Developer Quickstart

## Prerequisites

- **Bun** 1.2.3 or higher ([install](https://bun.sh))
- **Podman** and **Docker Compose** (for PostgreSQL)
- **Git** for version control

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd VeganMealAppApi
```

### 2. Install Dependencies

```bash
bun install
```

This installs:
- TypeScript 5.3+
- Prisma 5.x (ORM)
- date-fns 3.5+ (date manipulation)
- ESLint 8.x + Prettier 3.x (code quality)
- Testing dependencies

### 3. Start PostgreSQL Database

```bash
docker-compose up -d
```

This starts PostgreSQL 16 on `localhost:5432` with:
- Database: `veganmealapp`
- User: `dbuser`
- Password: `dbpassword`

Verify it's running:

```bash
docker-compose ps
```

### 4. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Default `.env` values for local development:

```env
# Database
DATABASE_URL="postgresql://dbuser:dbpassword@localhost:5432/veganmealapp?schema=public"

# Server
PORT=3000
NODE_ENV=development

# JWT (generate your own secret for production!)
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="7d"

# CORS
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:5173"
```

### 5. Initialize Database

Run Prisma migrations to create database schema:

```bash
bun run db:migrate
```

This creates all tables, indexes, and constraints defined in `prisma/schema.prisma`.

### 6. Seed Database (Optional)

Populate database with sample data for development:

```bash
bun run db:seed
```

This creates:
- 1 tenant (Acme Corp)
- 2 users (admin + regular user)
- User settings with MONDAY start day
- 10 sample meals with various qualities
- 15 ingredients with different storage types
- 1 planned week with 7 days

## Running the Application

### Development Mode (with hot reload)

```bash
bun run dev
```

Server starts on `http://localhost:3000` with auto-restart on file changes.

### Production Mode

```bash
bun run build
bun run start
```

## Verify Installation

### Health Check

```bash
curl http://localhost:3000/api/v1/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-01-06T12:00:00.000Z",
  "version": "1.0.0"
}
```

### Database Connection

```bash
bun run db:studio
```

Opens Prisma Studio at `http://localhost:5555` for visual database exploration.

## Testing

### Run All Tests

```bash
bun test
```

### Run Tests in Watch Mode

```bash
bun test --watch
```

### Run Specific Test File

```bash
bun test src/domain/meal/meal.spec.ts
```

### Test Coverage

```bash
bun test --coverage
```

Target coverage: 80%+ (Constitution requirement)

## Code Quality

### Lint Code

```bash
bun run lint
```

### Fix Linting Issues

```bash
bun run lint:fix
```

### Format Code

```bash
bun run format
```

### Type Check

```bash
bun run type-check
```

## API Testing with Postman

### Import OpenAPI Spec

1. Open Postman
2. Click **Import** → **File**
3. Select `/specs/001-001-meal-planning-api/contracts/openapi.yaml`
4. Postman auto-generates collection with all endpoints

### Authenticate

1. Login endpoint (implement in Phase 2):

```bash
POST http://localhost:3000/api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@acme.com",
  "password": "password123"
}
```

2. Copy `access_token` from response
3. In Postman collection → **Authorization** → Bearer Token → paste token
4. All requests now include authentication

### Sample Requests

**Create Planned Week:**

```bash
POST http://localhost:3000/api/v1/planned-weeks
Content-Type: application/json
Authorization: Bearer <token>

{
  "startingDate": "2025-01-06"
}
```

**Get Eligible Meals:**

```bash
GET http://localhost:3000/api/v1/meals/eligible?date=2025-01-06&mealType=dinner
Authorization: Bearer <token>
```

**Create Meal:**

```bash
POST http://localhost:3000/api/v1/meals
Content-Type: application/json
Authorization: Bearer <token>

{
  "mealName": "Creamy Cashew Alfredo",
  "recipeLink": "https://example.com/recipes/alfredo",
  "qualities": {
    "isDinner": true,
    "isCreamy": true,
    "makesLunch": true,
    "isEasyToMake": false
  },
  "ingredientIds": ["<uuid>", "<uuid>"]
}
```

## Database Management

### Create New Migration

After modifying `prisma/schema.prisma`:

```bash
bun run db:migrate:dev
```

Prisma prompts for migration name (e.g., "add_meal_categories").

### Reset Database (Development Only)

**⚠️ WARNING: Deletes all data!**

```bash
bun run db:reset
```

This:
1. Drops database
2. Recreates schema
3. Runs all migrations
4. Runs seed script

### View Migration Status

```bash
bun run db:migrate:status
```

### Generate Prisma Client

After schema changes:

```bash
bun run db:generate
```

Usually unnecessary (auto-runs on migration).

## Project Structure

```
.
├── src/
│   ├── domain/              # Business entities & logic
│   │   ├── meal/
│   │   ├── planned-week/
│   │   ├── ingredient/
│   │   └── user/
│   ├── application/         # Use cases & services
│   │   ├── meal/
│   │   ├── planned-week/
│   │   └── shared/
│   ├── infrastructure/      # External concerns
│   │   ├── database/
│   │   ├── http/
│   │   └── config/
│   └── index.ts            # Application entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts            # Sample data generator
├── specs/                  # Feature specifications
├── tests/                  # E2E and integration tests
├── docker-compose.yml      # PostgreSQL container config
├── .env                    # Environment variables
├── .env.example            # Template for .env
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.json         # ESLint rules
├── .prettierrc            # Prettier formatting
└── package.json           # Dependencies and scripts
```

## Common Scripts

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server with hot reload |
| `bun run build` | Compile TypeScript to production build |
| `bun run start` | Run production build |
| `bun test` | Run all tests |
| `bun test --watch` | Run tests in watch mode |
| `bun run lint` | Check code for linting errors |
| `bun run lint:fix` | Auto-fix linting issues |
| `bun run format` | Format code with Prettier |
| `bun run type-check` | Run TypeScript type checking |
| `bun run db:migrate` | Apply pending migrations (production) |
| `bun run db:migrate:dev` | Create and apply new migration (dev) |
| `bun run db:reset` | Reset database (dev only) |
| `bun run db:seed` | Populate with sample data |
| `bun run db:studio` | Open Prisma Studio GUI |
| `bun run db:generate` | Regenerate Prisma Client |

## Troubleshooting

### Port Already in Use

If port 3000 is occupied:

1. Change `PORT` in `.env`
2. Or kill existing process:

```bash
lsof -ti:3000 | xargs kill -9
```

### Database Connection Failed

1. Verify PostgreSQL is running:

```bash
docker-compose ps
```

2. Check logs:

```bash
docker-compose logs postgres
```

3. Restart container:

```bash
docker-compose restart
```

### Prisma Migration Drift Detected

Schema manually modified outside migrations:

```bash
bun run db:migrate:dev --create-only
# Review generated migration
bun run db:migrate:dev
```

### ESLint Errors

Auto-fix common issues:

```bash
bun run lint:fix
```

For persistent errors, check `.eslintrc.json` configuration.

## Development Workflow

1. **Create Feature Branch**

```bash
git checkout -b feature/meal-filtering
```

2. **Write Failing Test First** (Test-First per Constitution)

```typescript
// src/domain/meal/meal.spec.ts
test('should filter meals by creamy quality', () => {
  // Test implementation
});
```

3. **Implement Feature**

```typescript
// src/domain/meal/meal.ts
export class Meal {
  // Implementation
}
```

4. **Run Tests**

```bash
bun test src/domain/meal/
```

5. **Lint & Format**

```bash
bun run lint:fix
bun run format
```

6. **Commit**

```bash
git add .
git commit -m "feat: add meal filtering by creamy quality"
```

7. **Push & PR**

```bash
git push origin feature/meal-filtering
```

## Architecture Principles (from Constitution)

1. **Clean Architecture**: Domain → Application → Infrastructure layers
2. **Test-First**: Write tests before implementation
3. **Domain-Driven Design**: Entities, Value Objects, Repositories
4. **Dependency Injection**: Constructor-based injection
5. **SOLID Principles**: Single Responsibility, Open/Closed, etc.
6. **Performance**: <200ms response time, efficient queries
7. **Vegan-First**: Use vegan examples (cashew cream, tofu, etc.)

## Next Steps

1. ✅ Database running locally
2. ✅ Dependencies installed
3. ✅ Schema migrated
4. ⬜ Implement authentication endpoints (`/auth/login`, `/auth/register`)
5. ⬜ Implement planned week endpoints
6. ⬜ Implement meal library endpoints
7. ⬜ Implement eligible meal filtering logic
8. ⬜ Add integration tests
9. ⬜ Deploy to staging environment

## Resources

- **Bun Documentation**: https://bun.sh/docs
- **Prisma Documentation**: https://www.prisma.io/docs
- **date-fns Documentation**: https://date-fns.org/docs
- **Clean Architecture**: https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html
- **OpenAPI Spec**: `/specs/001-001-meal-planning-api/contracts/openapi.yaml`
- **Feature Spec**: `/specs/001-001-meal-planning-api/spec.md`
- **Data Model**: `/specs/001-001-meal-planning-api/data-model.md`

## Support

For questions or issues:
- Check `/specs/001-001-meal-planning-api/` documentation
- Review Constitution: `.specify/memory/constitution.md`
- Consult implementation plan: `/specs/001-001-meal-planning-api/plan.md`

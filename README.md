# Vegan Meal Planning API

> A modern RESTful API for managing vegan meal planning, meal libraries, and weekly meal schedules.

![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)
![Bun](https://img.shields.io/badge/Bun-1.2.3+-black.svg)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue.svg)
![License](https://img.shields.io/badge/License-MIT-green.svg)

## Features

- 🥗 **Multi-tenant Support**: Row-level isolation for multiple users/tenants
- 📅 **Weekly Meal Planning**: Create and manage 7-day meal planning cycles
- 🍽️ **Meal Library Management**: Build and maintain your personal meal collection
- 🥕 **Ingredient Tracking**: Track ingredients with storage types (pantry, fridge, freezer)
- 🎯 **Quality-Based Filtering**: Filter meals by qualities (creamy, acidic, green veg, etc.)
- 🎲 **Random Meal Suggestion**: Get a random meal suggestion for meal planning
- 📊 **Leftover Auto-Population**: Automatically populate leftovers for next-day lunches
- 🔒 **Role-Based Access Control**: Tenant admins can configure preferences
- ⚡ **Clean Architecture**: Domain-driven design with clear separation of concerns
- 🧪 **Comprehensive Testing**: Unit, integration, and e2e tests

## Quick Start

### Prerequisites

- **Bun** 1.2.3+ ([install](https://bun.sh))
- **Podman** or **Docker** with **Docker Compose**
- **Git**

### Setup in 5 Minutes

```bash
# 1. Clone the repository
git clone <repository-url>
cd VeganMealAppApi

# 2. Install dependencies
bun install

# 3. Start PostgreSQL
docker-compose up -d

# 4. Set up environment
cp .env.example .env

# 5. Initialize database
bun run db:migrate
bun run db:seed          # Optional: load sample data for development

# 6. Start development server
bun run dev
```

Server runs on `http://localhost:3000/api/v1` ✅

### Verify Installation

```bash
curl http://localhost:3000/api/v1/health
```

## Development

### Common Commands

```bash
# Development
bun run dev              # Start with hot reload
bun run build            # Build for production
bun run start            # Run production build

# Testing
bun test                 # Run all tests
bun test --watch         # Run in watch mode
bun test --coverage      # Generate coverage report

# Code Quality
bun run lint             # Check for linting issues
bun run lint:fix         # Auto-fix linting issues
bun run format           # Format code with Prettier
bun run type-check       # TypeScript type checking

# Database
bun run db:migrate       # Apply pending migrations
bun run db:migrate:dev   # Create new migration
bun run db:reset         # Reset database (dev only)
bun run db:seed          # Populate with sample data
bun run db:studio        # Open Prisma Studio GUI
```

## API Documentation

### Authentication

All endpoints require JWT Bearer token in `Authorization` header:

```bash
Authorization: Bearer <jwt-token>
```

### Key Endpoints

#### Planned Weeks

- `POST /api/v1/planned-weeks` - Create a week
- `GET /api/v1/planned-weeks/:weekId` - Get week details
- `DELETE /api/v1/planned-weeks/:weekId` - Delete a week

#### Meals

- `GET /api/v1/meals` - List meals
- `POST /api/v1/meals` - Create meal
- `GET /api/v1/meals/:id` - Get meal details
- `PUT /api/v1/meals/:id` - Update meal
- `DELETE /api/v1/meals/:id` - Archive meal
- `GET /api/v1/meals/eligible` - Get eligible meals for date/type
- `GET /api/v1/meals/random` - Get random eligible meal

#### Ingredients

- `GET /api/v1/ingredients` - List ingredients
- `POST /api/v1/ingredients` - Create ingredient
- `PUT /api/v1/ingredients/:id` - Update ingredient
- `DELETE /api/v1/ingredients/:id` - Delete ingredient

#### User Settings

- `GET /api/v1/user-settings` - Get preferences
- `PUT /api/v1/user-settings` - Update preferences

For complete API documentation, see [OpenAPI Spec](./specs/001-001-meal-planning-api/contracts/openapi.yaml)

## Project Structure

```
src/
├── domain/              # Business entities & logic (clean architecture)
│   ├── meal/           # Meal entity and qualities
│   ├── planned-week/   # Weekly planning logic
│   ├── ingredient/     # Ingredient management
│   └── user/           # User and settings
├── application/         # Use cases & orchestration
│   ├── meal/           # Meal use cases
│   ├── planned-week/   # Planning use cases
│   └── ingredient/     # Ingredient use cases
├── infrastructure/      # External concerns (DB, HTTP)
│   ├── database/       # Prisma repositories
│   ├── http/           # Controllers, routes, middleware
│   ├── di/             # Dependency injection container
│   └── config/         # Configuration
└── index.ts            # Application bootstrap

tests/
├── unit/               # Domain & use case tests
├── integration/        # Repository tests
└── e2e/               # API contract tests

specs/
└── 001-001-meal-planning-api/
    ├── spec.md         # Feature specification
    ├── plan.md         # Implementation plan
    ├── data-model.md   # Database schema
    └── contracts/      # OpenAPI specification
```

## Architecture

This project follows **Clean Architecture** principles:

- **Domain Layer**: Core business logic, no external dependencies
- **Application Layer**: Use cases, orchestration
- **Infrastructure Layer**: Databases, HTTP, configuration

**Benefits**: Testability, maintainability, independence from frameworks

See [plan.md](./specs/001-001-meal-planning-api/plan.md) for detailed architecture

## Testing

Target coverage: **80%+**

```bash
# Run tests with coverage
bun test --coverage

# Run specific test file
bun test tests/unit/domain/meal/meal.spec.ts

# Run tests matching pattern
bun test --test-match "*meal*"
```

## Database

### Schema

Database schema is managed with **Prisma** and defined in `prisma/schema.prisma`

### Migrations

```bash
# Create new migration after schema changes
bun run db:migrate:dev --name add_new_feature

# View migration status
bun run db:migrate:status

# Reset database (development only)
bun run db:reset
```

### Database Seeding

Development sample data is provided via a deterministic seed script. Use it to get realistic meals, ingredients, planned weeks, and user settings without manual data entry.

```bash
bun run db:seed
```

- **Quick start**: [specs/002-dev-db-seed/quickstart.md](./specs/002-dev-db-seed/quickstart.md) — run seed, verify data, common commands
- **Full guide**: [specs/002-dev-db-seed/SEEDING-GUIDE.md](./specs/002-dev-db-seed/SEEDING-GUIDE.md) — file structure, idempotency, troubleshooting

The seed creates 2 tenants, 10 meals and 15 ingredients per tenant, user settings, and 2 planned weeks per tenant (~50% meal coverage). Re-running is idempotent (no duplicates).

## Deployment

### Production Build

```bash
bun run build
bun run start
```

### Environment Variables

See `.env.example` for required variables:

```env
DATABASE_URL=          # PostgreSQL connection string
PORT=3000              # Server port
NODE_ENV=production    # Environment
JWT_SECRET=            # JWT signing secret (change in production!)
```

## Contributing

1. Create feature branch: `git checkout -b feature/your-feature`
2. Write tests first (TDD)
3. Implement feature
4. Run tests: `bun test`
5. Lint & format: `bun run lint:fix && bun run format`
6. Commit: `git commit -m "feat: your feature"`
7. Push: `git push origin feature/your-feature`

## Learning Resources

- [Bun Documentation](https://bun.sh/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [date-fns Library](https://date-fns.org/docs)

## License

MIT - See LICENSE file for details

## Support

- 📖 [Developer Quickstart](./specs/001-001-meal-planning-api/quickstart.md)
- 📋 [Feature Specification](./specs/001-001-meal-planning-api/spec.md)
- 📊 [Data Model](./specs/001-001-meal-planning-api/data-model.md)
- 🔌 [API Specification](./specs/001-001-meal-planning-api/contracts/openapi.yaml)

---

**Built with ❤️ for the vegan community** 🌱

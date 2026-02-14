# VeganMealAppApi Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-13

## Active Technologies
- TypeScript 5.3+ (strict mode, ESNext target, bundler module resolution) + Bun 1.2.3+ (runtime), Prisma 7.x (ORM), date-fns 3.5+ (date library), ESLint 8.x + Prettier 3.x (code quality) (001-001-meal-planning-api)
- PostgreSQL 16 with row-level multi-tenancy isolation (001-001-meal-planning-api)
- TypeScript 5.x (matching project stack) + Prisma ORM, prisma seed CLI (002-dev-db-seed)
- PostgreSQL (via Prisma client) (002-dev-db-seed)
- bcrypt (password hashing), jsonwebtoken (JWT tokens), nodemailer (email delivery), rate-limiter-flexible (rate limiting) (003-user-auth)

- (001-001-meal-planning-api)

## Project Structure

```text
backend/
frontend/
tests/
```

## Commands

# Add commands for 

## Code Style

: Follow standard conventions

## Recent Changes
- 003-user-auth: Added bcrypt (password hashing), jsonwebtoken (JWT tokens), nodemailer (email delivery), rate-limiter-flexible (rate limiting)
- 002-dev-db-seed: Added TypeScript 5.x (matching project stack) + Prisma ORM, prisma seed CLI
- 001-001-meal-planning-api: Added TypeScript 5.3+ (strict mode, ESNext target, bundler module resolution) + Bun 1.2.3+ (runtime), Prisma 5.x (ORM), date-fns 3.5+ (date library), ESLint 8.x + Prettier 3.x (code quality)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

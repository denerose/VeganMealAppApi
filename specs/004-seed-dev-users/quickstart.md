# Quickstart: Seed Dev Users (004-seed-dev-users)

**Feature**: 004-seed-dev-users  
**Date**: 2025-02-15

## What this feature adds

After running the database seed, you get **3 dev test users** you can use to sign in and test auth and tenant isolation:

- **Tenant-1**: 2 users (1 tenant admin, 1 regular user)
- **Tenant-2**: 1 user (tenant admin)

All 3 share **one password**, documented in the seeding guide.

## Quick steps

1. **Run the seed** (if not already run):
   ```bash
   bun run db:seed
   ```
2. **Get credentials**: See the **Seed dev users** section in [docs/SEEDING-GUIDE.md](../../docs/SEEDING-GUIDE.md) for:
   - The 3 user emails and nicknames
   - The shared password
3. **Sign in**: Use any of the 3 emails with the shared password in your app or API (e.g. login endpoint).
4. **Re-run seed**: Safe to run `bun run db:seed` again; existing seed users are skipped (no duplicates, no updates).

## Where to read more

- **Full seeding guide**: [docs/SEEDING-GUIDE.md](../../docs/SEEDING-GUIDE.md) — file structure, idempotency, **seed dev users table**, troubleshooting
- **Feature spec**: [spec.md](./spec.md) — requirements and acceptance criteria
- **Implementation plan**: [plan.md](./plan.md) — technical approach and file layout

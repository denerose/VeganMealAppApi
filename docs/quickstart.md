# Dev Environment Quickstart

Get the Vegan Meal Planning API running locally in a few minutes.

---

## Prerequisites

- **Bun** 1.2.3+ — [install](https://bun.sh)
- **Podman** (or Docker) with **Compose** — for PostgreSQL
- **Git**

---

## 1. Clone and install

```bash
git clone <repository-url>
cd VeganMealAppApi
bun install
```

---

## 2. Start PostgreSQL

From the project root:

```bash
podman compose up -d
```

*(If you use Docker: `docker compose up -d`.)*

This starts PostgreSQL 16 on `localhost:5432` with:

- Database: `vegan_meal_db`
- User: `vegan_meal_user`
- Password: `local_dev_password`

Check the container:

```bash
podman compose ps
```

You should see the `postgres` service running.

---

## 3. Environment

```bash
cp .env.example .env
```

The default `.env` matches the Compose database. You can leave it as-is for local dev. Optional: set `SEED_VERBOSE=true` for detailed seed logs.

---

## 4. Database: migrate and seed

Create the schema:

```bash
bun run db:migrate
```

Load sample data (tenants, users, meals, ingredients, planned weeks):

```bash
bun run db:seed
```

---

## 5. Run the dev server

```bash
bun run dev
```

API base: **http://localhost:3000/api/v1**

---

## Verify

**Health:**

```bash
curl http://localhost:3000/api/v1/health
```

**Quick auth test (after seeding):**

```bash
curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"dev-tenant1-admin@seed.local","password":"DevPassword1!"}' | head -c 200
```

(Seeded dev users: `dev-tenant1-admin@seed.local`, `dev-tenant1-user@seed.local`, `dev-tenant2-admin@seed.local` — shared password `DevPassword1!`. See [Seeding Guide](./SEEDING-GUIDE.md).)

---

## Common dev commands

| Command | Description |
|--------|-------------|
| `bun run dev` | Start API with hot reload |
| `bun run check` | Format check, lint, tests (use this instead of running format/lint/test separately) |
| `bun run db:studio` | Open Prisma Studio at http://localhost:5555 |
| `bun run db:reset` | Reset DB and re-run migrations (dev only) |
| `bun run db:seed` | Re-run seed (idempotent) |

---

## Troubleshooting

**Database not ready**

- Wait a few seconds after `podman compose up -d`, then run `bun run db:migrate` again.
- Check logs: `podman compose logs postgres`

**Port 5432 or 3000 in use**

- Stop other Postgres or apps using those ports, or change `PORT` in `.env` and/or the Compose port mapping.

**Migrations or seed fail**

- Ensure `DATABASE_URL` in `.env` matches Compose:  
  `postgresql://vegan_meal_user:local_dev_password@localhost:5432/vegan_meal_db?schema=public`
- Full reset: `bun run db:reset` then `bun run db:seed`

**Stopping the stack**

```bash
podman compose down
```

Data persists in the `postgres_data` volume. Use `podman compose down -v` to remove the volume and start with a clean DB next time.

---

## Next steps

- [Seeding Guide](./SEEDING-GUIDE.md) — seed contents, verification, customization
- [README](../README.md) — API overview, auth, endpoints, project structure
- [OpenAPI](../openapi.yaml) — full API reference

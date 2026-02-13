/**
 * Development Database Seed Script
 *
 * Purpose: Populate the development database with realistic sample data for testing
 * and local development without manual data creation.
 *
 * Features:
 * - Deterministic data generation (same input = same output)
 * - Check-and-skip idempotency (prevents duplicates on re-runs)
 * - Multi-tenant data isolation
 * - Comprehensive logging with optional verbose mode
 * - Error handling with exit codes for CI/CD integration
 *
 * Usage:
 *   npm run db:seed              # Run seed normally
 *   SEED_VERBOSE=true npm run db:seed   # Run with verbose logging
 *   npm run db:reset             # Reset database and re-seed
 *
 * Exit Codes:
 *   0 - Success (data seeded or already exists)
 *   1 - Error (database connection, constraint violation, etc.)
 *
 * Idempotency:
 * The script checks for a marker meal ("Creamy Cashew Alfredo Pasta") to detect
 * if seed data already exists. If found, the script logs a skip message and exits
 * with code 0. If not found, the script proceeds with seeding.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { seedDatabase } from "./seed-utils.js";

/**
 * Initialize Prisma client with PostgreSQL adapter
 */
function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  const pool = new Pool({ connectionString: databaseUrl });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

/**
 * Main seed execution function
 */
async function main(): Promise<void> {
  const prisma = createPrismaClient();

  try {
    const startTime = Date.now();

    // Execute seed
    const result = await seedDatabase(prisma);

    // Log completion
    const duration = Date.now() - startTime;
    console.log(
      `✅ Seed completed successfully in ${(duration / 1000).toFixed(2)}s`
    );
    console.log(`   - ${result.mealsCreated} meals created`);
    console.log(`   - ${result.ingredientsCreated} ingredients created`);
    console.log(`   - ${result.tenantsCreated} tenants created`);
    console.log(`   - ${result.userSettingsCreated} user settings created`);
    console.log(`   - ${result.plannedWeeksCreated} planned weeks created`);
    console.log(`   - ${result.dayPlansCreated} day plans created`);
  } catch (error) {
    // Log error and exit with code 1
    console.error("❌ Seed failed:");
    if (error instanceof Error) {
      console.error(`   Error: ${error.message}`);
      if (error.stack && process.env.SEED_VERBOSE === "true") {
        console.error(`   Stack: ${error.stack}`);
      }
    } else {
      console.error(`   Error: ${String(error)}`);
    }
    process.exit(1);
  } finally {
    // Always disconnect Prisma
    await prisma.$disconnect();
  }
}

// Run main function
main();

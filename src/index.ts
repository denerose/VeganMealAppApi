import { withErrorHandling } from '@/infrastructure/http/middleware/error-handler.middleware';
import { createHttpRouter, registerRoutes } from '@/infrastructure/http/routes';
import { registerDependencies, TOKENS } from '@/infrastructure/di/setup';
import { container } from '@/infrastructure/di/container';

// Initialize dependency injection
registerDependencies();

const port = Number(Bun.env.PORT ?? 3000);
const router = createHttpRouter();

// Register application routes
registerRoutes(router, {
  plannedWeek: container.resolve(TOKENS.PlannedWeekController),
  dayPlan: container.resolve(TOKENS.DayPlanController),
  // meal: container.resolve(TOKENS.MealController), // TODO: Enable when repositories are implemented
});

const fetchHandler = withErrorHandling(request => router.handle(request));

const server = Bun.serve({
  port,
  fetch: fetchHandler,
});

// eslint-disable-next-line no-console -- server startup message
console.log(`Vegan Meal Planning API listening on http://localhost:${server.port}`);

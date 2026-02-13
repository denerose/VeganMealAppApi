import type { DayPlanController } from '@/infrastructure/http/controllers/day-plan.controller';
import type { IngredientController } from '@/infrastructure/http/controllers/ingredient.controller';
import type { MealController } from '@/infrastructure/http/controllers/meal.controller';
import type { PlannedWeekController } from '@/infrastructure/http/controllers/planned-week.controller';
import type { UserSettingsController } from '@/infrastructure/http/controllers/user-settings.controller';
import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RouteContext = {
  request: Request;
  url: URL;
  params: Record<string, string>;
};

export type RouteHandler = (context: RouteContext) => Promise<Response> | Response;

interface URLPatternExecResult {
  pathname: { groups?: Record<string, string> };
}

export interface URLPatternLike {
  exec(url: URL): URLPatternExecResult | null;
}

/** Bun runtime provides URLPattern globally */
declare const URLPattern: new (init: { pathname: string }) => URLPatternLike;

type RouteDefinition = {
  method: HttpMethod;
  pattern: URLPatternLike;
  handler: RouteHandler;
};

const jsonResponse = (body: unknown, status = 200): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

export class AppRouter {
  private readonly routes: RouteDefinition[] = [];

  get(path: string, handler: RouteHandler): void {
    this.add('GET', path, handler);
  }

  post(path: string, handler: RouteHandler): void {
    this.add('POST', path, handler);
  }

  put(path: string, handler: RouteHandler): void {
    this.add('PUT', path, handler);
  }

  patch(path: string, handler: RouteHandler): void {
    this.add('PATCH', path, handler);
  }

  delete(path: string, handler: RouteHandler): void {
    this.add('DELETE', path, handler);
  }

  async handle(request: Request): Promise<Response> {
    const method = request.method.toUpperCase();
    const url = new URL(request.url);

    for (const route of this.routes) {
      if (route.method !== method) {
        continue;
      }

      const match: URLPatternExecResult | null = route.pattern.exec(url);

      if (match) {
        const params: Record<string, string> = match.pathname.groups ?? {};
        return route.handler({
          request,
          url,
          params,
        });
      }
    }

    return jsonResponse(createErrorBody('Resource not found'), 404);
  }

  private add(method: HttpMethod, path: string, handler: RouteHandler): void {
    this.routes.push({
      method,
      pattern: new URLPattern({ pathname: path }),
      handler,
    });
  }
}

const API_PREFIX = '/api/v1';

export const createHttpRouter = (): AppRouter => {
  const router = new AppRouter();

  router.get(`${API_PREFIX}/health`, ({ url }) =>
    jsonResponse({
      status: 'ok',
      timestamp: new Date().toISOString(),
      path: url.pathname,
    })
  );

  return router;
};

export type RouteControllers = {
  plannedWeek: PlannedWeekController;
  dayPlan: DayPlanController;
  meal?: MealController;
  ingredient?: IngredientController;
  userSettings?: UserSettingsController;
};

export const registerRoutes = (router: AppRouter, controllers: RouteControllers): void => {
  const prefix = API_PREFIX;

  // Planned Weeks
  router.get(`${prefix}/planned-weeks`, ctx => controllers.plannedWeek.list(ctx));
  router.post(`${prefix}/planned-weeks`, ctx => controllers.plannedWeek.create(ctx));
  router.get(`${prefix}/planned-weeks/:weekId`, ctx => controllers.plannedWeek.getById(ctx));
  router.delete(`${prefix}/planned-weeks/:weekId`, ctx => controllers.plannedWeek.delete(ctx));

  // Day Plans
  router.get(`${prefix}/day-plans/:dayPlanId`, ctx => controllers.dayPlan.get(ctx));
  router.patch(`${prefix}/day-plans/:dayPlanId`, ctx => controllers.dayPlan.update(ctx));

  // Meals
  if (controllers.meal) {
    const meal = controllers.meal;
    router.get(`${prefix}/meals`, (ctx): Promise<Response> => meal.list(ctx));
    router.post(`${prefix}/meals`, (ctx): Promise<Response> => meal.create(ctx));
    router.get(`${prefix}/meals/eligible`, (ctx): Promise<Response> => meal.getEligible(ctx));
    router.get(`${prefix}/meals/random`, (ctx): Promise<Response> => meal.getRandom(ctx));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- meal controller methods return Promise<Response>
    router.get(`${prefix}/meals/:id`, (ctx: RouteContext): Promise<Response> => meal.get(ctx));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call -- meal controller methods return Promise<Response>
    router.put(`${prefix}/meals/:id`, (ctx: RouteContext): Promise<Response> => meal.update(ctx));
    router.delete(`${prefix}/meals/:id`, (ctx): Promise<Response> => meal.archive(ctx));
  }

  // Ingredients
  if (controllers.ingredient) {
    const ingredient = controllers.ingredient;
    router.get(`${prefix}/ingredients`, (ctx): Promise<Response> => ingredient.list(ctx));
    router.post(`${prefix}/ingredients`, (ctx): Promise<Response> => ingredient.create(ctx));
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
    router.get(`${prefix}/ingredients/:id`, (ctx): Promise<Response> => ingredient.get(ctx));
    /* eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call */
    router.put(`${prefix}/ingredients/:id`, (ctx): Promise<Response> => ingredient.update(ctx));
    router.delete(`${prefix}/ingredients/:id`, (ctx): Promise<Response> => ingredient.delete(ctx));
  }

  // User Settings
  if (controllers.userSettings) {
    const userSettings = controllers.userSettings;
    router.get(`${prefix}/user-settings`, ctx => userSettings.getUserSettings(ctx));
    router.put(`${prefix}/user-settings`, ctx => userSettings.updateUserSettings(ctx));
  }
};

import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';

// Bun runtime provides URLPattern
declare const URLPattern: any;

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RouteContext = {
  request: Request;
  url: URL;
  params: Record<string, string>;
};

export type RouteHandler = (context: RouteContext) => Promise<Response> | Response;

type RouteDefinition = {
  method: HttpMethod;
  pattern: any; // URLPattern from Bun runtime
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

      const match = route.pattern.exec(url);

      if (match) {
        return route.handler({
          request,
          url,
          params: match.pathname.groups ?? {},
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
    }),
  );

  return router;
}

export const registerRoutes = (
  router: AppRouter,
  controllers: {
    plannedWeek: any;
    dayPlan: any;
    meal?: any;
    ingredient?: any;
    userSettings?: any;
  },
): void => {
  const prefix = API_PREFIX;

  // Planned Weeks
  router.post(`${prefix}/planned-weeks`, ctx => controllers.plannedWeek.create(ctx));
  router.get(`${prefix}/planned-weeks/:weekId`, ctx => controllers.plannedWeek.getById(ctx));
  router.delete(`${prefix}/planned-weeks/:weekId`, ctx => controllers.plannedWeek.delete(ctx));

  // Day Plans
  router.patch(`${prefix}/day-plans/:dayPlanId`, ctx => controllers.dayPlan.update(ctx));

  // Meals
  if (controllers.meal) {
    router.get(`${prefix}/meals`, ctx => controllers.meal.list(ctx));
    router.post(`${prefix}/meals`, ctx => controllers.meal.create(ctx));
    router.get(`${prefix}/meals/eligible`, ctx => controllers.meal.getEligible(ctx));
    router.get(`${prefix}/meals/random`, ctx => controllers.meal.getRandom(ctx));
    router.get(`${prefix}/meals/:id`, ctx => controllers.meal.get(ctx));
    router.put(`${prefix}/meals/:id`, ctx => controllers.meal.update(ctx));
    router.delete(`${prefix}/meals/:id`, ctx => controllers.meal.archive(ctx));
  }

  // Ingredients
  if (controllers.ingredient) {
    router.get(`${prefix}/ingredients`, ctx => controllers.ingredient.list(ctx));
    router.post(`${prefix}/ingredients`, ctx => controllers.ingredient.create(ctx));
    router.get(`${prefix}/ingredients/:id`, ctx => controllers.ingredient.get(ctx));
    router.put(`${prefix}/ingredients/:id`, ctx => controllers.ingredient.update(ctx));
    router.delete(`${prefix}/ingredients/:id`, ctx => controllers.ingredient.delete(ctx));
  }

  // User Settings
  if (controllers.userSettings) {
    router.get(`${prefix}/user-settings`, ctx => controllers.userSettings.get(ctx));
    router.put(`${prefix}/user-settings`, ctx => controllers.userSettings.update(ctx));
  }
};;

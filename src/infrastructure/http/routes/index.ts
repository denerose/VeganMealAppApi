import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type RouteContext = {
  request: Request;
  url: URL;
  params: Record<string, string>;
};

export type RouteHandler = (context: RouteContext) => Promise<Response> | Response;

type RouteDefinition = {
  method: HttpMethod;
  pattern: URLPattern;
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
};

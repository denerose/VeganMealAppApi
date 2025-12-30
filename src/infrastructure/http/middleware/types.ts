export type HttpContext = {
  request: Request;
  url: URL;
  tenantId?: string;
  userId?: string;
  roles?: string[];
};

export type HttpMiddleware = (
  context: HttpContext,
) => Promise<HttpContext> | HttpContext;

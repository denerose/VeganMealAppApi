import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';
import { ValidationError } from '@/infrastructure/http/middleware/validation.middleware';

type Handler = (request: Request) => Promise<Response> | Response;

const jsonResponse = (body: unknown, status: number): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });

export const withErrorHandling = (handler: Handler): Handler => async request => {
  try {
    return await handler(request);
  } catch (error) {
    if (error instanceof ValidationError) {
      return jsonResponse(createErrorBody(error.message, error.details), 422);
    }

    console.error('Unhandled error', error);
    return jsonResponse(createErrorBody('Internal Server Error'), 500);
  }
};

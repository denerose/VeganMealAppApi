import { withErrorHandling } from '@/infrastructure/http/middleware/error-handler.middleware';
import { createHttpRouter } from '@/infrastructure/http/routes';

const port = Number(Bun.env.PORT ?? 3000);
const router = createHttpRouter();

const fetchHandler = withErrorHandling(request => router.handle(request));

const server = Bun.serve({
	port,
	fetch: fetchHandler,
});

console.log(`Vegan Meal Planning API listening on http://localhost:${server.port}`);
import { CreateIngredientUseCase } from '@/application/use-cases/create-ingredient.use-case';
import { ListIngredientsUseCase } from '@/application/use-cases/list-ingredients.use-case';
import { UpdateIngredientUseCase } from '@/application/use-cases/update-ingredient.use-case';
import { DeleteIngredientUseCase } from '@/application/use-cases/delete-ingredient.use-case';
import {
  validateCreateIngredientRequest,
  validateUpdateIngredientRequest,
  toIngredientResponseDto,
} from '../dtos/ingredient.dto';
import type { RouteContext } from '@/infrastructure/http/routes';
import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';

export class IngredientController {
  constructor(
    private readonly createIngredientUseCase: CreateIngredientUseCase,
    private readonly listIngredientsUseCase: ListIngredientsUseCase,
    private readonly updateIngredientUseCase: UpdateIngredientUseCase,
    private readonly deleteIngredientUseCase: DeleteIngredientUseCase
  ) {}

  async create(context: RouteContext): Promise<Response> {
    try {
      const body = await context.request.json();
      const dto = validateCreateIngredientRequest(body);

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.createIngredientUseCase.execute({
        ...dto,
        tenantId,
      });

      return new Response(JSON.stringify(toIngredientResponseDto(snapshot)), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      if (error.message.includes('Invalid request')) {
        return new Response(JSON.stringify(createErrorBody(error.message)), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Error creating ingredient:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async list(context: RouteContext): Promise<Response> {
    try {
      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const url = new URL(context.request.url);
      const filters: any = {};

      if (url.searchParams.get('name')) filters.name = url.searchParams.get('name');
      if (url.searchParams.get('storageType')) filters.storageType = url.searchParams.get('storageType');
      if (url.searchParams.get('isStaple')) filters.isStaple = url.searchParams.get('isStaple') === 'true';

      const pagination = {
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 50,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!, 10) : 0,
      };

      const result = await this.listIngredientsUseCase.execute({
        tenantId,
        filters,
        pagination,
      });

      return new Response(
        JSON.stringify({
          items: result.items.map(toIngredientResponseDto),
          total: result.total,
          limit: result.limit,
          offset: result.offset,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error: any) {
      console.error('Error listing ingredients:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async update(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id;
      const body = await context.request.json();
      const dto = validateUpdateIngredientRequest(body);

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.updateIngredientUseCase.execute({
        id,
        tenantId,
        ...dto,
      });

      return new Response(JSON.stringify(toIngredientResponseDto(snapshot)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return new Response(JSON.stringify(createErrorBody(error.message)), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (error.message.includes('Invalid request')) {
        return new Response(JSON.stringify(createErrorBody(error.message)), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Error updating ingredient:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async delete(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id;

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      await this.deleteIngredientUseCase.execute({
        id,
        tenantId,
      });

      return new Response(null, { status: 204 });
    } catch (error: any) {
      if (error.message.includes('not found')) {
        return new Response(JSON.stringify(createErrorBody(error.message)), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Error deleting ingredient:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

import { CreateIngredientUseCase } from '@/application/use-cases/create-ingredient.use-case';
import { GetIngredientUseCase } from '@/application/use-cases/get-ingredient.use-case';
import { ListIngredientsUseCase } from '@/application/use-cases/list-ingredients.use-case';
import { UpdateIngredientUseCase } from '@/application/use-cases/update-ingredient.use-case';
import { DeleteIngredientUseCase } from '@/application/use-cases/delete-ingredient.use-case';
import type { IngredientFilters } from '@/domain/ingredient/ingredient.repository';
import { StorageType, STORAGE_TYPE_VALUES } from '@/domain/shared/storage-type.enum';
import {
  validateCreateIngredientRequest,
  validateUpdateIngredientRequest,
  toIngredientResponseDto,
} from '../dtos/ingredient.dto';
import type { RouteContext } from '@/infrastructure/http/routes';
import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export class IngredientController {
  constructor(
    private readonly getIngredientUseCase: GetIngredientUseCase,
    private readonly createIngredientUseCase: CreateIngredientUseCase,
    private readonly listIngredientsUseCase: ListIngredientsUseCase,
    private readonly updateIngredientUseCase: UpdateIngredientUseCase,
    private readonly deleteIngredientUseCase: DeleteIngredientUseCase
  ) {}

  async get(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id ?? undefined;
      if (!id) {
        return new Response(JSON.stringify(createErrorBody('Ingredient ID is required')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.getIngredientUseCase.execute({ id, tenantId });

      return new Response(JSON.stringify(toIngredientResponseDto(snapshot)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error: unknown) {
      if (errorMessage(error).includes('not found')) {
        return new Response(JSON.stringify(createErrorBody(errorMessage(error))), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      console.error('Error fetching ingredient:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async create(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
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
    } catch (error: unknown) {
      if (errorMessage(error).includes('Invalid request')) {
        return new Response(JSON.stringify(createErrorBody(errorMessage(error))), {
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
      const filters: IngredientFilters = {};

      const name = url.searchParams.get('name');
      if (name) filters.name = name;
      const storageTypeParam = url.searchParams.get('storageType');
      if (storageTypeParam && STORAGE_TYPE_VALUES.includes(storageTypeParam as StorageType)) {
        filters.storageType = storageTypeParam as StorageType;
      }
      const isStapleParam = url.searchParams.get('isStaple');
      if (isStapleParam !== null) filters.isStaple = isStapleParam === 'true';

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
    } catch (error: unknown) {
      console.error('Error listing ingredients:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async update(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id ?? undefined;
      if (!id) {
        return new Response(JSON.stringify(createErrorBody('Ingredient ID is required')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const body = (await context.request.json()) as unknown;
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
    } catch (error: unknown) {
      const msg = errorMessage(error);
      if (msg.includes('not found')) {
        return new Response(JSON.stringify(createErrorBody(msg)), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (msg.includes('Invalid request')) {
        return new Response(JSON.stringify(createErrorBody(msg)), {
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
      const id = context.params.id ?? undefined;
      if (!id) {
        return new Response(JSON.stringify(createErrorBody('Ingredient ID is required')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      await this.deleteIngredientUseCase.execute({
        id,
        tenantId,
      });

      return new Response(null, { status: 204 });
    } catch (error: unknown) {
      if (errorMessage(error).includes('not found')) {
        return new Response(JSON.stringify(createErrorBody(errorMessage(error))), {
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

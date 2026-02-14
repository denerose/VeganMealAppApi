import { CreateIngredientUseCase } from '@/application/ingredient/create-ingredient.use-case';
import { GetIngredientUseCase } from '@/application/ingredient/get-ingredient.use-case';
import { ListIngredientsUseCase } from '@/application/ingredient/list-ingredients.use-case';
import { UpdateIngredientUseCase } from '@/application/ingredient/update-ingredient.use-case';
import { DeleteIngredientUseCase } from '@/application/ingredient/delete-ingredient.use-case';
import type { IngredientFilters } from '@/domain/ingredient/ingredient.repository';
import { StorageType, STORAGE_TYPE_VALUES } from '@/domain/shared/storage-type.enum';
import {
  validateCreateIngredientRequest,
  validateUpdateIngredientRequest,
  toIngredientResponseDto,
} from '../dtos/ingredient.dto';
import type { RouteContext } from '@/infrastructure/http/routes';
import { createErrorBody, errorMessage } from '@/infrastructure/http/dtos/common.dto';
import { jsonResponse } from '@/infrastructure/http/response.utils';

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
        return jsonResponse(createErrorBody('Ingredient ID is required'), 400);
      }

      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.getIngredientUseCase.execute({ id, tenantId });

      return jsonResponse(toIngredientResponseDto(snapshot));
    } catch (error: unknown) {
      if (errorMessage(error).includes('not found')) {
        return jsonResponse(createErrorBody(errorMessage(error)), 404);
      }
      console.error('Error fetching ingredient:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
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

      return jsonResponse(toIngredientResponseDto(snapshot), 201);
    } catch (error: unknown) {
      if (errorMessage(error).includes('Invalid request')) {
        return jsonResponse(createErrorBody(errorMessage(error)), 400);
      }
      console.error('Error creating ingredient:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
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

      return jsonResponse({
        items: result.items.map(toIngredientResponseDto),
        total: result.total,
        limit: result.limit,
        offset: result.offset,
      });
    } catch (error: unknown) {
      console.error('Error listing ingredients:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async update(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id ?? undefined;
      if (!id) {
        return jsonResponse(createErrorBody('Ingredient ID is required'), 400);
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

      return jsonResponse(toIngredientResponseDto(snapshot));
    } catch (error: unknown) {
      const msg = errorMessage(error);
      if (msg.includes('not found')) {
        return jsonResponse(createErrorBody(msg), 404);
      }
      if (msg.includes('Invalid request')) {
        return jsonResponse(createErrorBody(msg), 400);
      }
      console.error('Error updating ingredient:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async delete(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id ?? undefined;
      if (!id) {
        return jsonResponse(createErrorBody('Ingredient ID is required'), 400);
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
        return jsonResponse(createErrorBody(errorMessage(error)), 404);
      }
      console.error('Error deleting ingredient:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }
}

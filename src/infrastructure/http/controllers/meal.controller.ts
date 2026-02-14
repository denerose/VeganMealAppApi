import type { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.use-case';
import type { GetRandomMealUseCase } from '@/application/meal/get-random-meal.use-case';
import { MealSlot, MEAL_SLOT_VALUES } from '@/domain/shared/meal-slot.enum';
import { createErrorBody, errorMessage } from '@/infrastructure/http/dtos/common.dto';
import { jsonResponse } from '@/infrastructure/http/response.utils';
import type { RouteContext } from '@/infrastructure/http/routes';
import type { MealSummaryDto } from '@/infrastructure/http/dtos/planned-week.dto';
import { CreateMealUseCase } from '@/application/meal/create-meal.use-case';
import { GetMealUseCase } from '@/application/meal/get-meal.use-case';
import { ListMealsUseCase } from '@/application/meal/list-meals.use-case';
import { UpdateMealUseCase } from '@/application/meal/update-meal.use-case';
import { ArchiveMealUseCase } from '@/application/meal/archive-meal.use-case';
import type { MealFilters } from '@/domain/meal/meal.repository';
import {
  validateCreateMealRequest,
  validateUpdateMealRequest,
  toMealResponseDto,
} from '../dtos/meal.dto';

export class MealController {
  constructor(
    private readonly getEligibleMealsUseCase: GetEligibleMealsUseCase,
    private readonly getRandomMealUseCase: GetRandomMealUseCase,
    private readonly getMealUseCase: GetMealUseCase,
    private readonly createMealUseCase: CreateMealUseCase,
    private readonly listMealsUseCase: ListMealsUseCase,
    private readonly updateMealUseCase: UpdateMealUseCase,
    private readonly archiveMealUseCase: ArchiveMealUseCase
  ) {}

  async getEligible(context: RouteContext): Promise<Response> {
    try {
      const url = new URL(context.request.url);
      const date = url.searchParams.get('date');
      const mealType = url.searchParams.get('mealType');

      if (!date) {
        return jsonResponse(
          createErrorBody('date query parameter is required (YYYY-MM-DD format)'),
          400
        );
      }

      if (!mealType || !MEAL_SLOT_VALUES.includes(mealType as MealSlot)) {
        return jsonResponse(
          createErrorBody('mealType query parameter must be "lunch" or "dinner"'),
          400
        );
      }

      // Validate date format
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        return jsonResponse(createErrorBody('date must be in YYYY-MM-DD format'), 400);
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const meals = await this.getEligibleMealsUseCase.execute({
        tenantId,
        date,
        mealType: mealType as MealSlot,
      });

      const response: MealSummaryDto[] = meals.map(meal => ({
        id: meal.id,
        mealName: meal.mealName,
        recipeLink: null,
        mealImageId: null,
        isArchived: false,
      }));

      return jsonResponse({ data: response });
    } catch (error) {
      if (errorMessage(error).includes('invalid date')) {
        return jsonResponse(createErrorBody('Invalid date provided'), 400);
      }

      if (errorMessage(error).includes('settings not found')) {
        return jsonResponse(createErrorBody('User settings not configured for this tenant'), 404);
      }

      console.error('Error fetching eligible meals:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async get(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id ?? undefined;
      if (!id) {
        return jsonResponse(createErrorBody('Meal ID is required'), 400);
      }

      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.getMealUseCase.execute({ id, tenantId });

      return jsonResponse(toMealResponseDto(snapshot));
    } catch (error: unknown) {
      if (errorMessage(error).includes('not found')) {
        return jsonResponse(createErrorBody(errorMessage(error)), 404);
      }
      console.error('Error fetching meal:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async getRandom(context: RouteContext): Promise<Response> {
    try {
      const url = new URL(context.request.url);
      const date = url.searchParams.get('date');
      const mealType = url.searchParams.get('mealType');

      if (!date) {
        return jsonResponse(
          createErrorBody('date query parameter is required (YYYY-MM-DD format)'),
          400
        );
      }

      if (!mealType || !MEAL_SLOT_VALUES.includes(mealType as MealSlot)) {
        return jsonResponse(
          createErrorBody('mealType query parameter must be "lunch" or "dinner"'),
          400
        );
      }

      // Validate date format
      const datePattern = /^\d{4}-\d{2}-\d{2}$/;
      if (!datePattern.test(date)) {
        return jsonResponse(createErrorBody('date must be in YYYY-MM-DD format'), 400);
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const meal = await this.getRandomMealUseCase.execute({
        tenantId,
        date,
        mealType: mealType as MealSlot,
      });

      if (!meal) {
        return jsonResponse({ data: null });
      }

      const response: MealSummaryDto = {
        id: meal.id,
        mealName: meal.mealName,
        recipeLink: null,
        mealImageId: null,
        isArchived: false,
      };

      return jsonResponse({ data: response });
    } catch (error) {
      if (error instanceof Error && error.message.includes('invalid date')) {
        return jsonResponse(createErrorBody('Invalid date provided'), 400);
      }

      if (error instanceof Error && error.message.includes('settings not found')) {
        return new Response(
          JSON.stringify(createErrorBody('User settings not configured for this tenant')),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      console.error('Error fetching random meal:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async create(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as unknown;
      const dto = validateCreateMealRequest(body);

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.createMealUseCase.execute({
        ...dto,
        tenantId,
      });

      return jsonResponse(toMealResponseDto(snapshot), 201);
    } catch (error: unknown) {
      if (errorMessage(error).includes('Invalid request')) {
        return jsonResponse(createErrorBody(errorMessage(error)), 400);
      }
      console.error('Error creating meal:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async list(context: RouteContext): Promise<Response> {
    try {
      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const url = new URL(context.request.url);
      const filters: MealFilters = {};

      const name = url.searchParams.get('name');
      if (name) filters.name = name;
      if (url.searchParams.get('isDinner'))
        filters.isDinner = url.searchParams.get('isDinner') === 'true';
      if (url.searchParams.get('isLunch'))
        filters.isLunch = url.searchParams.get('isLunch') === 'true';
      if (url.searchParams.get('isCreamy'))
        filters.isCreamy = url.searchParams.get('isCreamy') === 'true';
      if (url.searchParams.get('isAcidic'))
        filters.isAcidic = url.searchParams.get('isAcidic') === 'true';
      if (url.searchParams.get('greenVeg'))
        filters.greenVeg = url.searchParams.get('greenVeg') === 'true';
      if (url.searchParams.get('makesLunch'))
        filters.makesLunch = url.searchParams.get('makesLunch') === 'true';
      if (url.searchParams.get('isEasyToMake'))
        filters.isEasyToMake = url.searchParams.get('isEasyToMake') === 'true';
      if (url.searchParams.get('needsPrep'))
        filters.needsPrep = url.searchParams.get('needsPrep') === 'true';
      if (url.searchParams.get('includeArchived'))
        filters.includeArchived = url.searchParams.get('includeArchived') === 'true';

      const pagination = {
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 50,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!, 10) : 0,
      };

      const result = await this.listMealsUseCase.execute({
        tenantId,
        filters,
        pagination,
      });

      return new Response(
        JSON.stringify({
          items: result.items.map(toMealResponseDto),
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
      console.error('Error listing meals:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async update(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id ?? undefined;
      if (!id) {
        return jsonResponse(createErrorBody('Meal ID is required'), 400);
      }
      const body = (await context.request.json()) as unknown;
      const dto = validateUpdateMealRequest(body);

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.updateMealUseCase.execute({
        id,
        tenantId,
        ...dto,
      });

      return jsonResponse(toMealResponseDto(snapshot));
    } catch (error: unknown) {
      const msg = errorMessage(error);
      if (msg.includes('not found')) {
        return jsonResponse(createErrorBody(msg), 404);
      }
      if (msg.includes('Invalid request')) {
        return jsonResponse(createErrorBody(msg), 400);
      }
      console.error('Error updating meal:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async archive(context: RouteContext): Promise<Response> {
    try {
      const id = context.params.id ?? undefined;
      if (!id) {
        return jsonResponse(createErrorBody('Meal ID is required'), 400);
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const snapshot = await this.archiveMealUseCase.execute({
        id,
        tenantId,
      });

      return jsonResponse(toMealResponseDto(snapshot));
    } catch (error: unknown) {
      if (errorMessage(error).includes('not found')) {
        return jsonResponse(createErrorBody(errorMessage(error)), 404);
      }
      console.error('Error archiving meal:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }
}

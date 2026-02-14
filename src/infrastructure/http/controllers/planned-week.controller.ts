import { WeekStartDay } from '@/domain/shared/week-start-day.enum';
import { PlannedWeek } from '@/domain/planned-week/planned-week.entity';
import type { CreatePlannedWeekUseCase } from '@/application/planned-week/create-planned-week.use-case';
import type { GetPlannedWeekUseCase } from '@/application/planned-week/get-planned-week.use-case';
import type { DeletePlannedWeekUseCase } from '@/application/planned-week/delete-planned-week.use-case';
import type { PopulateLeftoversUseCase } from '@/application/planned-week/populate-leftovers.use-case';
import type { ListPlannedWeeksUseCase } from '@/application/planned-week/list-planned-weeks.use-case';
import {
  type PlannedWeekResponseDto,
  validateCreatePlannedWeekRequest,
} from '@/infrastructure/http/dtos/planned-week.dto';
import { createErrorBody, errorMessage } from '@/infrastructure/http/dtos/common.dto';
import { jsonResponse } from '@/infrastructure/http/response.utils';
import type { RouteContext } from '@/infrastructure/http/routes';

export class PlannedWeekController {
  constructor(
    private readonly createPlannedWeekUseCase: CreatePlannedWeekUseCase,
    private readonly getPlannedWeekUseCase: GetPlannedWeekUseCase,
    private readonly deletePlannedWeekUseCase: DeletePlannedWeekUseCase,
    private readonly populateLeftoversUseCase: PopulateLeftoversUseCase,
    private readonly listPlannedWeeksUseCase: ListPlannedWeeksUseCase
  ) {}

  async create(context: RouteContext): Promise<Response> {
    try {
      const body = (await context.request.json()) as Record<string, unknown>;
      const validation = validateCreatePlannedWeekRequest(body);

      if (!validation.valid) {
        return jsonResponse(createErrorBody('Validation failed', validation.errors), 400);
      }

      // TODO: Extract tenantId and weekStartDay from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';
      const weekStartDay = WeekStartDay.MONDAY; // TODO: Fetch from UserSettings

      const plannedWeek = await this.createPlannedWeekUseCase.execute({
        tenantId,
        startingDate: validation.data.startingDate,
        weekStartDay,
      });

      await this.populateLeftoversUseCase.execute({
        tenantId,
        plannedWeekId: plannedWeek.props.id!,
      });

      const refreshedWeek = await this.getPlannedWeekUseCase.execute({
        tenantId,
        plannedWeekId: plannedWeek.props.id!,
      });

      const response = this.toResponseDto(refreshedWeek);

      return jsonResponse({ data: response }, 201);
    } catch (error) {
      const msg = errorMessage(error);
      if (msg.includes('already exists')) {
        return jsonResponse(
          createErrorBody('Planned week already exists for this start date'),
          400
        );
      }
      if (msg.includes('must align')) {
        return jsonResponse(
          createErrorBody('Starting date must align with configured week start day'),
          400
        );
      }
      console.error('Error creating planned week:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async list(context: RouteContext): Promise<Response> {
    try {
      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const url = new URL(context.request.url);
      const filters: { startDate?: string; endDate?: string } = {};

      const startDate = url.searchParams.get('startDate');
      if (startDate) {
        filters.startDate = startDate;
      }

      const endDate = url.searchParams.get('endDate');
      if (endDate) {
        filters.endDate = endDate;
      }

      const pagination = {
        limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!, 10) : 20,
        offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!, 10) : 0,
      };

      const result = await this.listPlannedWeeksUseCase.execute({
        tenantId,
        filters: Object.keys(filters).length > 0 ? filters : undefined,
        pagination,
      });

      return jsonResponse({
        data: result.items.map(snapshot => {
          const plannedWeek = PlannedWeek.rehydrate(snapshot);
          return this.toResponseDto(plannedWeek);
        }),
        pagination: {
          offset: result.offset,
          limit: result.limit,
          total: result.total,
          hasMore: result.offset + result.items.length < result.total,
        },
      });
    } catch (error) {
      console.error('Error listing planned weeks:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async getById(context: RouteContext): Promise<Response> {
    try {
      const weekId = context.params.weekId;
      if (!weekId) {
        return jsonResponse(createErrorBody('Week ID is required'), 400);
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      const plannedWeek = await this.getPlannedWeekUseCase.execute({
        tenantId,
        plannedWeekId: weekId,
      });

      const response = this.toResponseDto(plannedWeek);

      return jsonResponse({ data: response });
    } catch (error) {
      if (errorMessage(error).includes('not found')) {
        return jsonResponse(createErrorBody('Planned week not found'), 404);
      }
      console.error('Error fetching planned week:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async delete(context: RouteContext): Promise<Response> {
    try {
      const weekId = context.params.weekId;
      if (!weekId) {
        return jsonResponse(createErrorBody('Week ID is required'), 400);
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      await this.deletePlannedWeekUseCase.execute({
        tenantId,
        plannedWeekId: weekId,
      });

      return new Response(null, { status: 204 });
    } catch (error) {
      if (errorMessage(error).includes('not found')) {
        return jsonResponse(createErrorBody('Planned week not found'), 404);
      }
      console.error('Error deleting planned week:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  private toResponseDto(plannedWeek: PlannedWeek): PlannedWeekResponseDto {
    const snapshot = plannedWeek.toSnapshot();

    return {
      id: snapshot.id,
      startingDate: snapshot.startingDate,
      tenantId: snapshot.tenantId,
      dayPlans: snapshot.dayPlans.map(dayPlan => ({
        id: '', // DayPlans don't have separate IDs in domain model yet
        date: dayPlan.date,
        longDay: dayPlan.longDay,
        shortDay: dayPlan.shortDay,
        isLeftover: dayPlan.isLeftover,
        lunchMeal: null, // TODO: Populate from meal repository
        dinnerMeal: null, // TODO: Populate from meal repository
        plannedWeekId: snapshot.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

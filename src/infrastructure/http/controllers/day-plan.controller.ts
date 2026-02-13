import type { AssignMealToDayUseCase } from '@/application/planned-week/assign-meal-to-day.usecase';
import type { GetPlannedWeekUseCase } from '@/application/planned-week/get-planned-week.usecase';
import type { MealSlot } from '@/domain/planned-week/planned-week.entity';
import {
  type DayPlanResponseDto,
  validateUpdateDayPlanRequest,
} from '@/infrastructure/http/dtos/planned-week.dto';
import { createErrorBody } from '@/infrastructure/http/dtos/common.dto';
import type { RouteContext } from '@/infrastructure/http/routes';

export class DayPlanController {
  constructor(
    private readonly assignMealToDayUseCase: AssignMealToDayUseCase,
    private readonly getPlannedWeekUseCase: GetPlannedWeekUseCase
  ) {}

  async get(context: RouteContext): Promise<Response> {
    try {
      const dayPlanId = context.params.dayPlanId;
      if (!dayPlanId) {
        return new Response(JSON.stringify(createErrorBody('Day plan ID is required')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      // Day plan ID format: {plannedWeekId}:{date}
      const [plannedWeekId, date] = dayPlanId.split(':');
      if (!plannedWeekId || !date) {
        return new Response(
          JSON.stringify(
            createErrorBody('Invalid day plan ID format. Expected: {weekId}:{YYYY-MM-DD}')
          ),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const plannedWeek = await this.getPlannedWeekUseCase.execute({
        tenantId,
        plannedWeekId,
      });

      const snapshot = plannedWeek.toSnapshot();
      const dayPlan = snapshot.dayPlans.find(dp => dp.date === date);

      if (!dayPlan) {
        return new Response(JSON.stringify(createErrorBody('Day plan not found')), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const response: DayPlanResponseDto = {
        id: dayPlanId,
        date: dayPlan.date,
        longDay: dayPlan.longDay,
        shortDay: dayPlan.shortDay,
        isLeftover: dayPlan.isLeftover,
        lunchMeal: null, // TODO: Populate from meal repository
        dinnerMeal: null, // TODO: Populate from meal repository
        plannedWeekId: snapshot.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return new Response(JSON.stringify({ data: response }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return new Response(JSON.stringify(createErrorBody('Day plan not found')), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.error('Error fetching day plan:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async update(context: RouteContext): Promise<Response> {
    try {
      const dayPlanId = context.params.dayPlanId;
      if (!dayPlanId) {
        return new Response(JSON.stringify(createErrorBody('Day plan ID is required')), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const body = (await context.request.json()) as Record<string, unknown>;
      const validation = validateUpdateDayPlanRequest(body);

      if (!validation.valid) {
        return new Response(
          JSON.stringify(createErrorBody('Validation failed', validation.errors)),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      // Day plan ID format: {plannedWeekId}:{date}
      const [plannedWeekId, date] = dayPlanId.split(':');
      if (!plannedWeekId || !date) {
        return new Response(
          JSON.stringify(
            createErrorBody('Invalid day plan ID format. Expected: {weekId}:{YYYY-MM-DD}')
          ),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const { lunchMealId, dinnerMealId, makesLunch } = validation.data;

      // Update lunch if provided
      if (lunchMealId !== undefined) {
        await this.assignMealToDayUseCase.execute({
          tenantId,
          plannedWeekId,
          date,
          slot: 'lunch' as MealSlot,
          meal: lunchMealId ? { mealId: lunchMealId } : undefined,
        });
      }

      // Update dinner if provided
      if (dinnerMealId !== undefined) {
        await this.assignMealToDayUseCase.execute({
          tenantId,
          plannedWeekId,
          date,
          slot: 'dinner' as MealSlot,
          meal: dinnerMealId ? { mealId: dinnerMealId, makesLunch } : undefined,
        });
      }

      // Fetch updated week to return the day plan
      const updatedWeek = await this.getPlannedWeekUseCase.execute({
        tenantId,
        plannedWeekId,
      });

      const snapshot = updatedWeek.toSnapshot();
      const dayPlan = snapshot.dayPlans.find(dp => dp.date === date);

      if (!dayPlan) {
        return new Response(JSON.stringify(createErrorBody('Day plan not found after update')), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const response: DayPlanResponseDto = {
        id: dayPlanId,
        date: dayPlan.date,
        longDay: dayPlan.longDay,
        shortDay: dayPlan.shortDay,
        isLeftover: dayPlan.isLeftover,
        lunchMeal: null, // TODO: Populate from meal repository
        dinnerMeal: null, // TODO: Populate from meal repository
        plannedWeekId: snapshot.id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return new Response(JSON.stringify({ data: response }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return new Response(JSON.stringify(createErrorBody('Planned week or day plan not found')), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      console.error('Error updating day plan:', error);
      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

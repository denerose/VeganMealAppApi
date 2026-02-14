import type { AssignMealToDayUseCase } from '@/application/planned-week/assign-meal-to-day.use-case';
import type { GetPlannedWeekUseCase } from '@/application/planned-week/get-planned-week.use-case';
import { MealSlot } from '@/domain/shared/meal-slot.enum';
import {
  type DayPlanResponseDto,
  validateUpdateDayPlanRequest,
} from '@/infrastructure/http/dtos/planned-week.dto';
import { createErrorBody, errorMessage } from '@/infrastructure/http/dtos/common.dto';
import { jsonResponse } from '@/infrastructure/http/response.utils';
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
        return jsonResponse(createErrorBody('Day plan ID is required'), 400);
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      // Day plan ID format: {plannedWeekId}:{date}
      const [plannedWeekId, date] = dayPlanId.split(':');
      if (!plannedWeekId || !date) {
        return jsonResponse(
          createErrorBody('Invalid day plan ID format. Expected: {weekId}:{YYYY-MM-DD}'),
          400
        );
      }

      const plannedWeek = await this.getPlannedWeekUseCase.execute({
        tenantId,
        plannedWeekId,
      });

      const snapshot = plannedWeek.toSnapshot();
      const dayPlan = snapshot.dayPlans.find(dp => dp.date === date);

      if (!dayPlan) {
        return jsonResponse(createErrorBody('Day plan not found'), 404);
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

      return jsonResponse({ data: response });
    } catch (error) {
      if (errorMessage(error).includes('not found')) {
        return jsonResponse(createErrorBody('Day plan not found'), 404);
      }
      console.error('Error fetching day plan:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async update(context: RouteContext): Promise<Response> {
    try {
      const dayPlanId = context.params.dayPlanId;
      if (!dayPlanId) {
        return jsonResponse(createErrorBody('Day plan ID is required'), 400);
      }

      const body = (await context.request.json()) as Record<string, unknown>;
      const validation = validateUpdateDayPlanRequest(body);

      if (!validation.valid) {
        return jsonResponse(createErrorBody('Validation failed', validation.errors), 400);
      }

      // TODO: Extract tenantId from auth context
      const tenantId = context.request.headers.get('x-tenant-id') || 'temp-tenant-id';

      // Day plan ID format: {plannedWeekId}:{date}
      const [plannedWeekId, date] = dayPlanId.split(':');
      if (!plannedWeekId || !date) {
        return jsonResponse(
          createErrorBody('Invalid day plan ID format. Expected: {weekId}:{YYYY-MM-DD}'),
          400
        );
      }

      const { lunchMealId, dinnerMealId, makesLunch } = validation.data;

      // Update lunch if provided
      if (lunchMealId !== undefined) {
        await this.assignMealToDayUseCase.execute({
          tenantId,
          plannedWeekId,
          date,
          slot: MealSlot.LUNCH,
          meal: lunchMealId ? { mealId: lunchMealId } : undefined,
        });
      }

      // Update dinner if provided
      if (dinnerMealId !== undefined) {
        await this.assignMealToDayUseCase.execute({
          tenantId,
          plannedWeekId,
          date,
          slot: MealSlot.DINNER,
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
        return jsonResponse(createErrorBody('Day plan not found after update'), 404);
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

      return jsonResponse({ data: response });
    } catch (error) {
      if (errorMessage(error).includes('not found')) {
        return jsonResponse(createErrorBody('Planned week or day plan not found'), 404);
      }
      console.error('Error updating day plan:', error);
      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }
}

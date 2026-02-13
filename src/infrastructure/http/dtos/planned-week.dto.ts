import type { DayOfWeek } from '@/domain/shared/day-of-week.enum';
import type { ShortDay } from '@/domain/shared/short-day.enum';

// =============================================================================
// REQUEST DTOs
// =============================================================================

export type CreatePlannedWeekRequestDto = {
  startingDate: string;
};

export type UpdateDayPlanRequestDto = {
  lunchMealId?: string | null;
  dinnerMealId?: string | null;
  makesLunch?: boolean;
};

// =============================================================================
// RESPONSE DTOs
// =============================================================================

export type DayPlanResponseDto = {
  id: string;
  date: string;
  longDay: DayOfWeek;
  shortDay: ShortDay;
  isLeftover: boolean;
  lunchMeal: MealSummaryDto | null;
  dinnerMeal: MealSummaryDto | null;
  plannedWeekId: string;
  createdAt: string;
  updatedAt: string;
};

export type PlannedWeekResponseDto = {
  id: string;
  startingDate: string;
  dayPlans: DayPlanResponseDto[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

export type MealSummaryDto = {
  id: string;
  mealName: string;
  recipeLink: string | null;
  mealImageId: string | null;
  isArchived: boolean;
};

// =============================================================================
// VALIDATORS
// =============================================================================

export const validateCreatePlannedWeekRequest = (
  body: unknown
): { valid: true; data: CreatePlannedWeekRequestDto } | { valid: false; errors: string[] } => {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const req = body as Record<string, unknown>;

  if (typeof req.startingDate !== 'string') {
    errors.push('startingDate is required and must be a string in YYYY-MM-DD format');
  } else {
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!datePattern.test(req.startingDate)) {
      errors.push('startingDate must be in YYYY-MM-DD format');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      startingDate: req.startingDate as string,
    },
  };
};

export const validateUpdateDayPlanRequest = (
  body: unknown
): { valid: true; data: UpdateDayPlanRequestDto } | { valid: false; errors: string[] } => {
  const errors: string[] = [];

  if (!body || typeof body !== 'object') {
    return { valid: false, errors: ['Request body must be an object'] };
  }

  const req = body as Record<string, unknown>;

  if ('lunchMealId' in req) {
    if (req.lunchMealId !== null && typeof req.lunchMealId !== 'string') {
      errors.push('lunchMealId must be a string (UUID) or null');
    }
  }

  if ('dinnerMealId' in req) {
    if (req.dinnerMealId !== null && typeof req.dinnerMealId !== 'string') {
      errors.push('dinnerMealId must be a string (UUID) or null');
    }
  }

  if ('makesLunch' in req) {
    if (typeof req.makesLunch !== 'boolean') {
      errors.push('makesLunch must be a boolean');
    }
  }

  if (!('lunchMealId' in req) && !('dinnerMealId' in req) && !('makesLunch' in req)) {
    errors.push('At least one of lunchMealId, dinnerMealId, or makesLunch must be provided');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      lunchMealId: 'lunchMealId' in req ? (req.lunchMealId as string | null) : undefined,
      dinnerMealId: 'dinnerMealId' in req ? (req.dinnerMealId as string | null) : undefined,
      makesLunch: 'makesLunch' in req ? (req.makesLunch as boolean) : undefined,
    },
  };
};

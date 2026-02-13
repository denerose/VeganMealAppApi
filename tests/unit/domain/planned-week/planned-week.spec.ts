import { describe, expect, it } from 'bun:test';

import { PlannedWeek } from '@/domain/planned-week/planned-week.entity';
import { DayOfWeek } from '@/domain/shared/day-of-week.enum';
import { ShortDay } from '@/domain/shared/short-day.enum';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

describe('PlannedWeek aggregate', () => {
  it('creates 7 consecutive day plans with derived day names', () => {
    const week = PlannedWeek.create({
      tenantId: 'tenant-1',
      startingDate: '2025-01-06',
      weekStartDay: WeekStartDay.MONDAY,
    });

    expect(week.dayPlans).toHaveLength(7);
    expect(week.dayPlans[0]).toMatchObject({
      date: '2025-01-06',
      longDay: DayOfWeek.MONDAY,
      shortDay: ShortDay.MON,
    });
    expect(week.dayPlans[6].date).toBe('2025-01-12');
  });

  it('throws when starting date does not match configured week start day', () => {
    expect(() =>
      PlannedWeek.create({
        tenantId: 'tenant-1',
        startingDate: '2025-01-07',
        weekStartDay: WeekStartDay.MONDAY,
      })
    ).toThrow('starting date must align with configured week start day');
  });

  it('assigns meals to lunch and dinner slots', () => {
    const week = PlannedWeek.create({
      tenantId: 'tenant-1',
      startingDate: '2025-01-06',
      weekStartDay: WeekStartDay.MONDAY,
    });

    week.assignMeal('2025-01-06', 'lunch', { mealId: 'meal-lunch' });
    week.assignMeal('2025-01-06', 'dinner', { mealId: 'meal-dinner' });

    const dayPlan = week.getDayPlan('2025-01-06');
    expect(dayPlan.lunchMealId).toBe('meal-lunch');
    expect(dayPlan.dinnerMealId).toBe('meal-dinner');
  });

  it('auto-populates leftovers for next day lunch when previous dinner makes lunch', () => {
    const week = PlannedWeek.create({
      tenantId: 'tenant-1',
      startingDate: '2025-01-06',
      weekStartDay: WeekStartDay.MONDAY,
    });

    week.assignMeal('2025-01-06', 'dinner', { mealId: 'meal-dinner', makesLunch: true });
    week.populateLeftovers();

    const tuesday = week.getDayPlan('2025-01-07');
    expect(tuesday.lunchMealId).toBe('meal-dinner');
    expect(tuesday.isLeftover).toBe(true);

    const monday = week.getDayPlan('2025-01-06');
    expect(monday.isLeftover).toBe(false);
  });
});

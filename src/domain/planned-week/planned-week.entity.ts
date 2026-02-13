import { addDays, format, getDay, isValid, parseISO } from 'date-fns';

import { DayOfWeek } from '@/domain/shared/day-of-week.enum';
import { ShortDay } from '@/domain/shared/short-day.enum';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

export type MealSlot = 'lunch' | 'dinner';

export type MealAssignment = {
  mealId: string;
  makesLunch?: boolean;
};

export type DayPlanState = {
  date: string;
  longDay: DayOfWeek;
  shortDay: ShortDay;
  lunchMealId: string | null;
  dinnerMealId: string | null;
  isLeftover: boolean;
};

export type PlannedWeekProps = {
  id?: string;
  tenantId: string;
  startingDate: string;
  weekStartDay: WeekStartDay;
};

export type PlannedWeekSnapshot = PlannedWeekProps & {
  id: string;
  dayPlans: DayPlanState[];
  dinnerAssignments?: Record<string, MealAssignment>;
};

const WEEK_START_DAY_INDEX: Record<WeekStartDay, number> = {
  [WeekStartDay.SUNDAY]: 0,
  [WeekStartDay.MONDAY]: 1,
  [WeekStartDay.SATURDAY]: 6,
};

const LONG_DAY_LOOKUP: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const SHORT_DAY_LOOKUP: ShortDay[] = [
  ShortDay.SUN,
  ShortDay.MON,
  ShortDay.TUE,
  ShortDay.WED,
  ShortDay.THU,
  ShortDay.FRI,
  ShortDay.SAT,
];

export class PlannedWeek {
  readonly dayPlans: DayPlanState[] = [];
  private readonly dinnerAssignments = new Map<string, MealAssignment>();

  private constructor(public readonly props: PlannedWeekProps) {}

  static create(props: PlannedWeekProps): PlannedWeek {
    const startDate = parseISO(props.startingDate);

    if (!isValid(startDate)) {
      throw new Error('starting date must be a valid ISO date');
    }

    PlannedWeek.assertWeekStartAlignment(startDate, props.weekStartDay);

    const plannedWeek = new PlannedWeek(props);
    plannedWeek.dayPlans.push(...plannedWeek.generateDayPlans(startDate));
    return plannedWeek;
  }

  static rehydrate(snapshot: PlannedWeekSnapshot): PlannedWeek {
    const plannedWeek = new PlannedWeek(snapshot);
    plannedWeek.dayPlans.push(...snapshot.dayPlans.map(plan => ({ ...plan })));
    if (snapshot.dinnerAssignments) {
      plannedWeek.setDinnerAssignments(snapshot.dinnerAssignments);
    } else {
      plannedWeek.rebuildDinnerAssignments();
    }
    return plannedWeek;
  }

  assignMeal(date: string, slot: MealSlot, assignment: MealAssignment): void {
    const dayPlan = this.getDayPlan(date);

    if (slot === 'lunch') {
      dayPlan.lunchMealId = assignment.mealId;
      dayPlan.isLeftover = false;
      return;
    }

    dayPlan.dinnerMealId = assignment.mealId;
    this.dinnerAssignments.set(date, {
      mealId: assignment.mealId,
      makesLunch: Boolean(assignment.makesLunch),
    });
  }

  removeMeal(date: string, slot: MealSlot): void {
    const dayPlan = this.getDayPlan(date);

    if (slot === 'lunch') {
      dayPlan.lunchMealId = null;
      dayPlan.isLeftover = false;
      return;
    }

    dayPlan.dinnerMealId = null;
    this.dinnerAssignments.delete(date);
  }

  populateLeftovers(): void {
    this.dayPlans.forEach((dayPlan, index) => {
      if (index === 0) {
        dayPlan.isLeftover = false;
        return;
      }

      if (dayPlan.lunchMealId) {
        return;
      }

      const previousDay = this.dayPlans[index - 1];
      const dinnerAssignment = this.dinnerAssignments.get(previousDay.date);

      if (dinnerAssignment && dinnerAssignment.makesLunch) {
        dayPlan.lunchMealId = dinnerAssignment.mealId;
        dayPlan.isLeftover = true;
      } else {
        dayPlan.isLeftover = false;
      }
    });
  }

  getDayPlan(date: string): DayPlanState {
    const dayPlan = this.dayPlans.find(plan => plan.date === date);

    if (!dayPlan) {
      throw new Error(`No day plan exists for date ${date}`);
    }

    return dayPlan;
  }

  toSnapshot(): PlannedWeekSnapshot {
    if (!this.props.id) {
      throw new Error('Cannot create snapshot without persistent identifier');
    }

    return {
      ...this.props,
      id: this.props.id,
      dayPlans: this.dayPlans.map(plan => ({ ...plan })),
      dinnerAssignments: Object.fromEntries(
        Array.from(this.dinnerAssignments.entries()).map(([date, assignment]) => [
          date,
          { ...assignment },
        ])
      ),
    };
  }

  private static assertWeekStartAlignment(date: Date, weekStartDay: WeekStartDay): void {
    const expectedDay = WEEK_START_DAY_INDEX[weekStartDay];
    const actualDay = getDay(date);

    if (expectedDay !== actualDay) {
      throw new Error('starting date must align with configured week start day');
    }
  }

  private generateDayPlans(startDate: Date): DayPlanState[] {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(startDate, index);
      const weekdayIndex = getDay(date);

      return {
        date: format(date, 'yyyy-MM-dd'),
        longDay: LONG_DAY_LOOKUP[weekdayIndex],
        shortDay: SHORT_DAY_LOOKUP[weekdayIndex],
        lunchMealId: null,
        dinnerMealId: null,
        isLeftover: false,
      } satisfies DayPlanState;
    });
  }

  private setDinnerAssignments(assignments: Record<string, MealAssignment>): void {
    this.dinnerAssignments.clear();
    Object.entries(assignments).forEach(([date, assignment]) => {
      this.dinnerAssignments.set(date, { ...assignment });
    });
  }

  private rebuildDinnerAssignments(): void {
    this.dinnerAssignments.clear();

    this.dayPlans.forEach(dayPlan => {
      if (dayPlan.dinnerMealId) {
        this.dinnerAssignments.set(dayPlan.date, {
          mealId: dayPlan.dinnerMealId,
          makesLunch: false,
        });
      }
    });
  }
}

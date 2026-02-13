import { getDay, isValid, parseISO } from 'date-fns';

import type { MealSlot } from '@/domain/planned-week/planned-week.entity';
import type { MealQualitiesProps } from '@/domain/meal/meal-qualities.vo';
import type { MealSummary } from '@/domain/meal/meal.repository';
import { DayOfWeek } from '@/domain/shared/day-of-week.enum';

const DAY_INDEX_TO_ENUM: DayOfWeek[] = [
  DayOfWeek.SUNDAY,
  DayOfWeek.MONDAY,
  DayOfWeek.TUESDAY,
  DayOfWeek.WEDNESDAY,
  DayOfWeek.THURSDAY,
  DayOfWeek.FRIDAY,
  DayOfWeek.SATURDAY,
];

const QUALITY_FLAGS = [
  'isCreamy',
  'isAcidic',
  'greenVeg',
  'makesLunch',
  'isEasyToMake',
  'needsPrep',
] as const;

export type MealQualities = MealQualitiesProps;

export type MealFilter = Partial<MealQualities> & {
  isArchived?: boolean;
};

export interface MealRepository {
  findByQualities(tenantId: string, filter: MealFilter): Promise<MealSummary[]>;
}

export type DailyPreference = {
  day: DayOfWeek;
  preferences: Partial<Record<(typeof QUALITY_FLAGS)[number], boolean>>;
};

export type UserSettings = {
  id: string;
  tenantId: string;
  weekStartDay: DayOfWeek;
  dailyPreferences: DailyPreference[];
};

export interface UserSettingsRepository {
  findByTenantId(tenantId: string): Promise<UserSettings | null>;
}

export type GetEligibleMealsRequest = {
  tenantId: string;
  date: string;
  mealType: MealSlot;
};

export class GetEligibleMealsUseCase {
  constructor(
    private readonly mealRepository: MealRepository,
    private readonly userSettingsRepository: UserSettingsRepository
  ) {}

  async execute(request: GetEligibleMealsRequest): Promise<MealSummary[]> {
    const targetDate = parseISO(request.date);

    if (!isValid(targetDate)) {
      throw new Error('invalid date supplied');
    }

    const settings = await this.userSettingsRepository.findByTenantId(request.tenantId);

    if (!settings) {
      throw new Error('user settings not found');
    }

    const day = DAY_INDEX_TO_ENUM[getDay(targetDate)];
    const preference = settings.dailyPreferences.find(pref => pref.day === day);

    const filter: MealFilter = {
      isArchived: false,
    };

    if (request.mealType === 'lunch') {
      filter.isLunch = true;
    } else {
      filter.isDinner = true;
    }

    if (preference) {
      QUALITY_FLAGS.forEach(flag => {
        if (preference.preferences?.[flag]) {
          filter[flag] = true;
        }
      });
    }

    return this.mealRepository.findByQualities(request.tenantId, filter);
  }
}

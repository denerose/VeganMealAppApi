import { getDay, isValid, parseISO } from 'date-fns';

import type {
  MealQualitiesFilter,
  MealRepository,
  MealSummary,
} from '@/domain/meal/meal.repository';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import { DAY_INDEX_TO_DAY_OF_WEEK } from '@/domain/shared/day-of-week.enum';
import { DAILY_PREFERENCE_KEYS } from '@/domain/shared/meal-quality.constants';
import { MealSlot } from '@/domain/shared/meal-slot.enum';

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

    if (!settings || settings.id === null) {
      throw new Error('user settings not found');
    }

    const day = DAY_INDEX_TO_DAY_OF_WEEK[getDay(targetDate)];
    const preference = settings.dailyPreferences.find(pref => pref.day === day);

    const filter: MealQualitiesFilter = {
      isArchived: false,
    };

    if (request.mealType === MealSlot.LUNCH) {
      filter.isLunch = true;
    } else {
      filter.isDinner = true;
    }

    if (preference) {
      DAILY_PREFERENCE_KEYS.forEach(flag => {
        if (preference.preferences?.[flag]) {
          filter[flag] = true;
        }
      });
    }

    return this.mealRepository.findByQualities(request.tenantId, filter);
  }
}

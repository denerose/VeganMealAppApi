import { describe, expect, it } from 'bun:test';

import { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.use-case';
import type {
  MealQualitiesFilter,
  MealRepository,
  MealSummary,
} from '@/domain/meal/meal.repository';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import { UserSettings } from '@/domain/user/user-settings.entity';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import { DayOfWeek, DAY_OF_WEEK_VALUES } from '@/domain/shared/day-of-week.enum';
import { MealSlot } from '@/domain/shared/meal-slot.enum';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

class InMemoryMealRepository {
  public lastFilter: MealQualitiesFilter | null = null;

  findByQualities(_tenantId: string, filter: MealQualitiesFilter): Promise<MealSummary[]> {
    this.lastFilter = filter;
    return Promise.resolve([
      {
        id: 'meal-1',
        mealName: 'Test Meal',
        qualities: {
          isDinner: true,
          isLunch: true,
          isCreamy: false,
          isAcidic: false,
          greenVeg: false,
          makesLunch: false,
          isEasyToMake: true,
          needsPrep: false,
        },
      },
    ]);
  }
}

class InMemoryUserSettingsRepository {
  constructor(private readonly settings: UserSettings | null) {}

  async findByTenantId(): Promise<UserSettings | null> {
    return Promise.resolve(this.settings);
  }
}

const defaultSettings = UserSettings.rehydrate({
  id: 'settings-1',
  tenantId: 'tenant-1',
  weekStartDay: WeekStartDay.MONDAY,
  dailyPreferences: DAY_OF_WEEK_VALUES.map(day => ({
    day,
    preferences: day === DayOfWeek.MONDAY ? { isEasyToMake: true } : {},
  })),
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('GetEligibleMealsUseCase', () => {
  it('throws when provided date is invalid', () => {
    const mealRepo = new InMemoryMealRepository();
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const useCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );

    return expect(
      useCase.execute({
        tenantId: 'tenant-1',
        date: 'invalid-date',
        mealType: MealSlot.LUNCH,
      })
    ).rejects.toThrow('invalid date supplied');
  });

  it('throws when user settings are missing', () => {
    const mealRepo = new InMemoryMealRepository();
    const settingsRepo = new InMemoryUserSettingsRepository(null);
    const useCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );

    return expect(
      useCase.execute({
        tenantId: 'tenant-1',
        date: '2025-01-06',
        mealType: MealSlot.LUNCH,
      })
    ).rejects.toThrow('user settings not found');
  });

  it('applies lunch flags and day preferences to the meal filter', async () => {
    const mealRepo = new InMemoryMealRepository();
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const useCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );

    await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-06',
      mealType: MealSlot.LUNCH,
    });

    expect(mealRepo.lastFilter).toMatchObject({
      isArchived: false,
      isLunch: true,
      isEasyToMake: true,
    });
  });

  it('applies dinner flag and ignores missing day preferences', async () => {
    const mealRepo = new InMemoryMealRepository();
    const emptyPrefs = UserSettings.rehydrate({
      id: 'settings-2',
      tenantId: 'tenant-1',
      weekStartDay: WeekStartDay.MONDAY,
      dailyPreferences: DAY_OF_WEEK_VALUES.map(day => ({ day, preferences: {} })),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const settingsRepo = new InMemoryUserSettingsRepository(emptyPrefs);
    const useCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );

    await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-07',
      mealType: MealSlot.DINNER,
    });

    expect(mealRepo.lastFilter).toMatchObject({
      isArchived: false,
      isDinner: true,
    });
  });
});

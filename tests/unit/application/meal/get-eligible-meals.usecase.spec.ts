import { describe, expect, it } from 'bun:test';

import {
  GetEligibleMealsUseCase,
  MealFilter,
  MealRepository,
  MealSummary,
  UserSettings,
  UserSettingsRepository,
} from '@/application/meal/get-eligible-meals.usecase';
import { DayOfWeek } from '@/domain/shared/day-of-week.enum';

class InMemoryMealRepository implements MealRepository {
  public lastFilter: MealFilter | null = null;

  findByQualities(_tenantId: string, filter: MealFilter): Promise<MealSummary[]> {
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

class InMemoryUserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly settings: UserSettings | null) {}

  findByTenantId(): Promise<UserSettings | null> {
    return Promise.resolve(this.settings);
  }
}

const defaultSettings: UserSettings = {
  id: 'settings-1',
  tenantId: 'tenant-1',
  weekStartDay: DayOfWeek.MONDAY,
  dailyPreferences: [
    {
      day: DayOfWeek.MONDAY,
      preferences: {
        isEasyToMake: true,
      },
    },
  ],
};

describe('GetEligibleMealsUseCase', () => {
  it('throws when provided date is invalid', () => {
    const mealRepo = new InMemoryMealRepository();
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

    return expect(
      useCase.execute({
        tenantId: 'tenant-1',
        date: 'invalid-date',
        mealType: 'lunch',
      })
    ).rejects.toThrow('invalid date supplied');
  });

  it('throws when user settings are missing', () => {
    const mealRepo = new InMemoryMealRepository();
    const settingsRepo = new InMemoryUserSettingsRepository(null);
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

    return expect(
      useCase.execute({ tenantId: 'tenant-1', date: '2025-01-06', mealType: 'lunch' })
    ).rejects.toThrow('user settings not found');
  });

  it('applies lunch flags and day preferences to the meal filter', async () => {
    const mealRepo = new InMemoryMealRepository();
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

    await useCase.execute({ tenantId: 'tenant-1', date: '2025-01-06', mealType: 'lunch' });

    expect(mealRepo.lastFilter).toMatchObject({
      isArchived: false,
      isLunch: true,
      isEasyToMake: true,
    });
  });

  it('applies dinner flag and ignores missing day preferences', async () => {
    const mealRepo = new InMemoryMealRepository();
    const settingsRepo = new InMemoryUserSettingsRepository({
      ...defaultSettings,
      dailyPreferences: [],
    });
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

    await useCase.execute({ tenantId: 'tenant-1', date: '2025-01-07', mealType: 'dinner' });

    expect(mealRepo.lastFilter).toMatchObject({
      isArchived: false,
      isDinner: true,
    });
  });
});

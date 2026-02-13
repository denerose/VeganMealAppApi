import { describe, expect, it } from 'bun:test';

import { GetRandomMealUseCase } from '@/application/meal/get-random-meal.usecase';
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
  constructor(private readonly meals: MealSummary[]) {}

  async findByQualities(_tenantId: string, _filter: MealFilter): Promise<MealSummary[]> {
    return this.meals;
  }
}

class InMemoryUserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly settings: UserSettings | null) {}

  async findByTenantId(): Promise<UserSettings | null> {
    return this.settings;
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

const createMealSummary = (id: string, name: string): MealSummary => ({
  id,
  mealName: name,
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
});

describe('GetRandomMealUseCase', () => {
  it('returns null when no eligible meals are available', async () => {
    const mealRepo = new InMemoryMealRepository([]);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-06',
      mealType: 'lunch',
    });

    expect(result).toBeNull();
  });

  it('returns a single meal when only one eligible meal is available', async () => {
    const meal = createMealSummary('meal-1', 'Single Meal');
    const mealRepo = new InMemoryMealRepository([meal]);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-06',
      mealType: 'lunch',
    });

    expect(result).toEqual(meal);
  });

  it('returns a meal from the eligible meals list when multiple are available', async () => {
    const meals = [
      createMealSummary('meal-1', 'Meal 1'),
      createMealSummary('meal-2', 'Meal 2'),
      createMealSummary('meal-3', 'Meal 3'),
    ];
    const mealRepo = new InMemoryMealRepository(meals);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-06',
      mealType: 'lunch',
    });

    expect(result).toBeDefined();
    expect(result?.id).toBeDefined();
    expect(meals.some(m => m.id === result?.id)).toBe(true);
  });

  it('returns different meals on repeated calls with multiple eligible meals', async () => {
    const meals = [
      createMealSummary('meal-1', 'Meal 1'),
      createMealSummary('meal-2', 'Meal 2'),
      createMealSummary('meal-3', 'Meal 3'),
      createMealSummary('meal-4', 'Meal 4'),
      createMealSummary('meal-5', 'Meal 5'),
    ];
    const mealRepo = new InMemoryMealRepository(meals);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result = await useCase.execute({
        tenantId: 'tenant-1',
        date: '2025-01-06',
        mealType: 'lunch',
      });
      if (result) {
        results.add(result.id);
      }
    }

    // With 5 meals and 20 calls, we should see at least 2 different meals
    expect(results.size).toBeGreaterThan(1);
  });

  it('throws when user settings are missing', async () => {
    const meal = createMealSummary('meal-1', 'Single Meal');
    const mealRepo = new InMemoryMealRepository([meal]);
    const settingsRepo = new InMemoryUserSettingsRepository(null);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        date: '2025-01-06',
        mealType: 'lunch',
      }),
    ).rejects.toThrow('user settings not found');
  });

  it('throws when date format is invalid', async () => {
    const meal = createMealSummary('meal-1', 'Single Meal');
    const mealRepo = new InMemoryMealRepository([meal]);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    await expect(
      useCase.execute({
        tenantId: 'tenant-1',
        date: 'invalid-date',
        mealType: 'lunch',
      }),
    ).rejects.toThrow('invalid date supplied');
  });
});

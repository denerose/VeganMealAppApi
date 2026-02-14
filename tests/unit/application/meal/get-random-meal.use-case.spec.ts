import { describe, expect, it } from 'bun:test';

import { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.use-case';
import { GetRandomMealUseCase } from '@/application/meal/get-random-meal.use-case';
import type {
  MealQualitiesFilter,
  MealRepository,
  MealSummary,
} from '@/domain/meal/meal.repository';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import { UserSettings } from '@/domain/user/user-settings.entity';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import { DAY_OF_WEEK_VALUES } from '@/domain/shared/day-of-week.enum';
import { MealSlot } from '@/domain/shared/meal-slot.enum';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

class InMemoryMealRepository {
  constructor(private readonly meals: MealSummary[]) {}

  findByQualities(_tenantId: string, _filter: MealQualitiesFilter): Promise<MealSummary[]> {
    return Promise.resolve(this.meals);
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
    preferences: {},
  })),
  createdAt: new Date(),
  updatedAt: new Date(),
});

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
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const result = await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-06',
      mealType: MealSlot.LUNCH,
    });

    expect(result).toBeNull();
  });

  it('returns a single meal when only one eligible meal is available', async () => {
    const meal: MealSummary = createMealSummary('meal-1', 'Single Meal');
    const mealRepo = new InMemoryMealRepository([meal]);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const result: MealSummary | null = await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-06',
      mealType: MealSlot.LUNCH,
    });

    expect(result).not.toBeNull();
    expect(result).toStrictEqual(meal);
  });

  it('returns a meal from the eligible meals list when multiple are available', async () => {
    const meals: MealSummary[] = [
      createMealSummary('meal-1', 'Meal 1'),
      createMealSummary('meal-2', 'Meal 2'),
      createMealSummary('meal-3', 'Meal 3'),
    ];
    const mealRepo = new InMemoryMealRepository(meals);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const result: MealSummary | null = await useCase.execute({
      tenantId: 'tenant-1',
      date: '2025-01-06',
      mealType: MealSlot.LUNCH,
    });

    expect(result).toBeDefined();
    const resultId: string | undefined = result?.id;
    expect(resultId).toBeDefined();
    expect(meals.some((m: MealSummary) => m.id === resultId)).toBe(true);
  });

  it('returns different meals on repeated calls with multiple eligible meals', async () => {
    const meals: MealSummary[] = [
      createMealSummary('meal-1', 'Meal 1'),
      createMealSummary('meal-2', 'Meal 2'),
      createMealSummary('meal-3', 'Meal 3'),
      createMealSummary('meal-4', 'Meal 4'),
      createMealSummary('meal-5', 'Meal 5'),
    ];
    const mealRepo = new InMemoryMealRepository(meals);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    const results = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const result: MealSummary | null = await useCase.execute({
        tenantId: 'tenant-1',
        date: '2025-01-06',
        mealType: MealSlot.LUNCH,
      });
      if (result) {
        results.add(result.id);
      }
    }

    // With 5 meals and 20 calls, we should see at least 2 different meals
    expect(results.size).toBeGreaterThan(1);
  });

  it('throws when user settings are missing', () => {
    const meal = createMealSummary('meal-1', 'Single Meal');
    const mealRepo = new InMemoryMealRepository([meal]);
    const settingsRepo = new InMemoryUserSettingsRepository(null);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    return expect(
      useCase.execute({
        tenantId: 'tenant-1',
        date: '2025-01-06',
        mealType: MealSlot.LUNCH,
      })
    ).rejects.toThrow('user settings not found');
  });

  it('throws when date format is invalid', () => {
    const meal = createMealSummary('meal-1', 'Single Meal');
    const mealRepo = new InMemoryMealRepository([meal]);
    const settingsRepo = new InMemoryUserSettingsRepository(defaultSettings);
    const eligibleMealsUseCase = new GetEligibleMealsUseCase(
      mealRepo as MealRepository,
      settingsRepo as UserSettingsRepository
    );
    const useCase = new GetRandomMealUseCase(eligibleMealsUseCase);

    return expect(
      useCase.execute({
        tenantId: 'tenant-1',
        date: 'invalid-date',
        mealType: MealSlot.LUNCH,
      })
    ).rejects.toThrow('invalid date supplied');
  });
});

import { describe, expect, it } from 'bun:test';

import { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.use-case';
import type { Meal, MealId } from '@/domain/meal/meal.entity';
import type {
  MealFilters,
  MealQualitiesFilter,
  MealRepository,
  MealSummary,
  PaginationOptions,
  PaginatedResult,
} from '@/domain/meal/meal.repository';
import { UserSettings } from '@/domain/user/user-settings.entity';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import { DayOfWeek, DAY_OF_WEEK_VALUES } from '@/domain/shared/day-of-week.enum';
import { MealSlot } from '@/domain/shared/meal-slot.enum';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

class InMemoryMealRepository implements MealRepository {
  public lastFilter: MealQualitiesFilter | null = null;

  create(): Promise<Meal> {
    throw new Error('Not implemented');
  }

  findById(): Promise<Meal | null> {
    return Promise.resolve(null);
  }

  findAll(
    _tenantId: string,
    _filters?: MealFilters,
    _pagination?: PaginationOptions
  ): Promise<PaginatedResult<Meal>> {
    return Promise.resolve({ items: [], total: 0, limit: 0, offset: 0 });
  }

  save(): Promise<Meal> {
    throw new Error('Not implemented');
  }

  delete(_id: MealId, _tenantId: string): Promise<void> {
    return Promise.resolve();
  }

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

class InMemoryUserSettingsRepository implements UserSettingsRepository {
  constructor(private readonly settings: UserSettings | null) {}

  async findByTenantId(): Promise<UserSettings | null> {
    return Promise.resolve(this.settings);
  }

  async create(): Promise<UserSettings> {
    await Promise.resolve();
    throw new Error('Not implemented');
  }

  async save(): Promise<UserSettings> {
    await Promise.resolve();
    throw new Error('Not implemented');
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
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

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
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

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
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

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
    const useCase = new GetEligibleMealsUseCase(mealRepo, settingsRepo);

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

import { WeekStartDay, WEEK_START_DAY_VALUES } from '../shared/week-start-day.enum';
import { DayOfWeek, DAY_OF_WEEK_VALUES } from '../shared/day-of-week.enum';

export type UserSettingsId = string;

export type QualityPreferences = {
  isCreamy?: boolean;
  isAcidic?: boolean;
  greenVeg?: boolean;
  isEasyToMake?: boolean;
  needsPrep?: boolean;
};

export type DailyPreferences = {
  day: DayOfWeek;
  preferences: QualityPreferences;
};

export type UserSettingsSnapshot = {
  id: UserSettingsId;
  weekStartDay: WeekStartDay;
  dailyPreferences: DailyPreferences[];
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
};

export class UserSettings {
  private constructor(
    private _id: UserSettingsId | null,
    private _weekStartDay: WeekStartDay,
    private _dailyPreferences: DailyPreferences[],
    private _tenantId: string,
    private _createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(tenantId: string, weekStartDay: WeekStartDay = WeekStartDay.MONDAY): UserSettings {
    // Validate weekStartDay
    if (!WEEK_START_DAY_VALUES.includes(weekStartDay)) {
      throw new Error(
        `Invalid week start day. Must be one of: ${WEEK_START_DAY_VALUES.join(', ')}`
      );
    }

    // Create default empty preferences for all 7 days
    const dailyPreferences: DailyPreferences[] = DAY_OF_WEEK_VALUES.map((day) => ({
      day,
      preferences: {},
    }));

    return new UserSettings(
      null,
      weekStartDay,
      dailyPreferences,
      tenantId,
      new Date(),
      new Date()
    );
  }

  static rehydrate(snapshot: UserSettingsSnapshot): UserSettings {
    // Validate dailyPreferences
    UserSettings.validateDailyPreferences(snapshot.dailyPreferences);

    return new UserSettings(
      snapshot.id,
      snapshot.weekStartDay,
      snapshot.dailyPreferences,
      snapshot.tenantId,
      snapshot.createdAt,
      snapshot.updatedAt
    );
  }

  private static validateDailyPreferences(dailyPreferences: DailyPreferences[]): void {
    // Must have exactly 7 entries
    if (dailyPreferences.length !== 7) {
      throw new Error('Daily preferences must contain exactly 7 entries (one for each day)');
    }

    // Check for duplicate days
    const days = dailyPreferences.map((dp) => dp.day);
    const uniqueDays = new Set(days);
    if (uniqueDays.size !== 7) {
      throw new Error('Daily preferences cannot contain duplicate days');
    }

    // Verify all days are present
    const missingDays = DAY_OF_WEEK_VALUES.filter((day) => !days.includes(day));
    if (missingDays.length > 0) {
      throw new Error(
        `Daily preferences must include all days of the week. Missing: ${missingDays.join(', ')}`
      );
    }

    // Validate each day is a valid DayOfWeek enum
    for (const dp of dailyPreferences) {
      if (!DAY_OF_WEEK_VALUES.includes(dp.day)) {
        throw new Error(`Invalid day of week: ${dp.day}`);
      }

      // Validate quality preferences are booleans if present
      if (dp.preferences) {
        const invalidKeys = Object.entries(dp.preferences)
          .filter(([key, value]) => value !== undefined && typeof value !== 'boolean')
          .map(([key]) => key);

        if (invalidKeys.length > 0) {
          throw new Error(
            `Quality preferences must be booleans. Invalid keys: ${invalidKeys.join(', ')}`
          );
        }
      }
    }
  }

  get id(): UserSettingsId | null {
    return this._id;
  }

  get weekStartDay(): WeekStartDay {
    return this._weekStartDay;
  }

  get dailyPreferences(): DailyPreferences[] {
    // Return a deep copy to prevent external mutation
    return this._dailyPreferences.map((dp) => ({
      day: dp.day,
      preferences: { ...dp.preferences },
    }));
  }

  get tenantId(): string {
    return this._tenantId;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateWeekStartDay(weekStartDay: WeekStartDay): void {
    if (!WEEK_START_DAY_VALUES.includes(weekStartDay)) {
      throw new Error(
        `Invalid week start day. Must be one of: ${WEEK_START_DAY_VALUES.join(', ')}`
      );
    }
    this._weekStartDay = weekStartDay;
    this._updatedAt = new Date();
  }

  updateDailyPreferences(dailyPreferences: DailyPreferences[]): void {
    UserSettings.validateDailyPreferences(dailyPreferences);

    // Deep copy to prevent external mutation
    this._dailyPreferences = dailyPreferences.map((dp) => ({
      day: dp.day,
      preferences: { ...dp.preferences },
    }));
    this._updatedAt = new Date();
  }

  assignId(id: UserSettingsId): void {
    if (this._id !== null) {
      throw new Error('Cannot reassign ID to user settings that already has one');
    }
    this._id = id;
  }

  toSnapshot(): UserSettingsSnapshot {
    if (this._id === null) {
      throw new Error('Cannot create snapshot without a persistent identifier');
    }

    return {
      id: this._id,
      weekStartDay: this._weekStartDay,
      dailyPreferences: this.dailyPreferences, // Using getter for deep copy
      tenantId: this._tenantId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

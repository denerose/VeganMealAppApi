import { WeekStartDay, WEEK_START_DAY_VALUES } from '@/domain/shared/week-start-day.enum';
import { DayOfWeek, DAY_OF_WEEK_VALUES } from '@/domain/shared/day-of-week.enum';
import type { UpdateUserSettingsDto, DailyPreferencesDto } from './user-settings.dto';

export function validateUpdateUserSettingsDto(data: any): UpdateUserSettingsDto {
  if (!data || typeof data !== 'object') {
    throw new Error('Request body must be an object');
  }

  const result: UpdateUserSettingsDto = {};

  // Validate weekStartDay if provided
  if (data.weekStartDay !== undefined) {
    if (typeof data.weekStartDay !== 'string') {
      throw new Error('weekStartDay must be a string');
    }

    if (!WEEK_START_DAY_VALUES.includes(data.weekStartDay as WeekStartDay)) {
      throw new Error(
        `weekStartDay must be one of: ${WEEK_START_DAY_VALUES.join(', ')}`
      );
    }

    result.weekStartDay = data.weekStartDay as WeekStartDay;
  }

  // Validate dailyPreferences if provided
  if (data.dailyPreferences !== undefined) {
    if (!Array.isArray(data.dailyPreferences)) {
      throw new Error('dailyPreferences must be an array');
    }

    if (data.dailyPreferences.length !== 7) {
      throw new Error('dailyPreferences must contain exactly 7 entries');
    }

    const validatedPreferences: DailyPreferencesDto[] = [];
    const seenDays = new Set<string>();

    for (const pref of data.dailyPreferences) {
      if (!pref || typeof pref !== 'object') {
        throw new Error('Each daily preference must be an object');
      }

      // Validate day
      if (typeof pref.day !== 'string') {
        throw new Error('Each daily preference must have a day field');
      }

      if (!DAY_OF_WEEK_VALUES.includes(pref.day as DayOfWeek)) {
        throw new Error(
          `day must be one of: ${DAY_OF_WEEK_VALUES.join(', ')}`
        );
      }

      if (seenDays.has(pref.day)) {
        throw new Error(`Duplicate day found: ${pref.day}`);
      }
      seenDays.add(pref.day);

      // Validate preferences object
      if (!pref.preferences || typeof pref.preferences !== 'object') {
        throw new Error('Each daily preference must have a preferences object');
      }

      const validQualityKeys = ['isCreamy', 'isAcidic', 'greenVeg', 'isEasyToMake', 'needsPrep'];
      const invalidKeys = Object.keys(pref.preferences).filter(
        (key) => !validQualityKeys.includes(key)
      );

      if (invalidKeys.length > 0) {
        throw new Error(
          `Invalid quality preference keys: ${invalidKeys.join(', ')}`
        );
      }

      // Validate boolean values
      for (const [key, value] of Object.entries(pref.preferences)) {
        if (value !== undefined && typeof value !== 'boolean') {
          throw new Error(`Quality preference ${key} must be a boolean`);
        }
      }

      validatedPreferences.push({
        day: pref.day as DayOfWeek,
        preferences: pref.preferences,
      });
    }

    // Verify all 7 days are present
    const missingDays = DAY_OF_WEEK_VALUES.filter((day) => !seenDays.has(day));
    if (missingDays.length > 0) {
      throw new Error(
        `Missing days in dailyPreferences: ${missingDays.join(', ')}`
      );
    }

    result.dailyPreferences = validatedPreferences;
  }

  // At least one field must be provided
  if (result.weekStartDay === undefined && result.dailyPreferences === undefined) {
    throw new Error('At least one field (weekStartDay or dailyPreferences) must be provided');
  }

  return result;
}

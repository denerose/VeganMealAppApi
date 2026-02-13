import { WeekStartDay, WEEK_START_DAY_VALUES } from '@/domain/shared/week-start-day.enum';
import { DayOfWeek, DAY_OF_WEEK_VALUES } from '@/domain/shared/day-of-week.enum';
import type { UpdateUserSettingsDto, DailyPreferencesDto } from './user-settings.dto';

/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unnecessary-type-assertion -- validated input from request body */
function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

export function validateUpdateUserSettingsDto(data: unknown): UpdateUserSettingsDto {
  if (!isRecord(data)) {
    throw new Error('Request body must be an object');
  }

  const result: UpdateUserSettingsDto = {};
  // data is Record<string, unknown> after isRecord guard
  const obj: Record<string, unknown> = data;

  // Validate weekStartDay if provided
  const weekStartDayVal: unknown = obj['weekStartDay'];
  if (weekStartDayVal !== undefined) {
    if (typeof weekStartDayVal !== 'string') {
      throw new Error('weekStartDay must be a string');
    }

    if (!WEEK_START_DAY_VALUES.includes(weekStartDayVal as WeekStartDay)) {
      throw new Error(`weekStartDay must be one of: ${WEEK_START_DAY_VALUES.join(', ')}`);
    }

    result.weekStartDay = weekStartDayVal as WeekStartDay;
  }

  // Validate dailyPreferences if provided
  const dailyPrefsVal: unknown = obj['dailyPreferences'];
  if (dailyPrefsVal !== undefined) {
    if (!Array.isArray(dailyPrefsVal)) {
      throw new Error('dailyPreferences must be an array');
    }

    if (dailyPrefsVal.length !== 7) {
      throw new Error('dailyPreferences must contain exactly 7 entries');
    }

    const validatedPreferences: DailyPreferencesDto[] = [];
    const seenDays = new Set<string>();

    for (const pref of dailyPrefsVal) {
      if (!isRecord(pref)) {
        throw new Error('Each daily preference must be an object');
      }

      const dayVal: unknown = (pref as Record<string, unknown>)['day'];
      if (typeof dayVal !== 'string') {
        throw new Error('Each daily preference must have a day field');
      }

      if (!DAY_OF_WEEK_VALUES.includes(dayVal as DayOfWeek)) {
        throw new Error(`day must be one of: ${DAY_OF_WEEK_VALUES.join(', ')}`);
      }

      if (seenDays.has(dayVal)) {
        throw new Error(`Duplicate day found: ${dayVal}`);
      }
      seenDays.add(dayVal);

      const prefsVal: unknown = (pref as Record<string, unknown>)['preferences'];
      if (!prefsVal || typeof prefsVal !== 'object') {
        throw new Error('Each daily preference must have a preferences object');
      }

      const prefsObj = prefsVal as Record<string, unknown>;
      const validQualityKeys = ['isCreamy', 'isAcidic', 'greenVeg', 'isEasyToMake', 'needsPrep'];
      const invalidKeys = Object.keys(prefsObj).filter(
        (key: string) => !validQualityKeys.includes(key)
      );

      if (invalidKeys.length > 0) {
        throw new Error(`Invalid quality preference keys: ${invalidKeys.join(', ')}`);
      }

      // Validate boolean values
      for (const [key, value] of Object.entries(prefsObj)) {
        if (value !== undefined && typeof value !== 'boolean') {
          throw new Error(`Quality preference ${key} must be a boolean`);
        }
      }

      validatedPreferences.push({
        day: dayVal as DayOfWeek,
        preferences: prefsObj as DailyPreferencesDto['preferences'],
      });
    }

    // Verify all 7 days are present
    const missingDays = DAY_OF_WEEK_VALUES.filter((day: DayOfWeek) => !seenDays.has(day));
    if (missingDays.length > 0) {
      throw new Error(`Missing days in dailyPreferences: ${missingDays.join(', ')}`);
    }

    result.dailyPreferences = validatedPreferences;
  }

  // At least one field must be provided
  if (result.weekStartDay === undefined && result.dailyPreferences === undefined) {
    throw new Error('At least one field (weekStartDay or dailyPreferences) must be provided');
  }

  return result;
}

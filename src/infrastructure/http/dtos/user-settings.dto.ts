import type { UserSettings } from '@/domain/user/user-settings.entity';
import type { WeekStartDay } from '@/domain/shared/week-start-day.enum';
import type { DayOfWeek } from '@/domain/shared/day-of-week.enum';

export type QualityPreferencesDto = {
  isCreamy?: boolean;
  isAcidic?: boolean;
  greenVeg?: boolean;
  isEasyToMake?: boolean;
  needsPrep?: boolean;
};

export type DailyPreferencesDto = {
  day: DayOfWeek;
  preferences: QualityPreferencesDto;
};

export type UserSettingsDto = {
  id: string;
  weekStartDay: WeekStartDay;
  dailyPreferences: DailyPreferencesDto[];
  tenantId: string;
  createdAt: string;
  updatedAt: string;
};

export type UpdateUserSettingsDto = {
  weekStartDay?: WeekStartDay;
  dailyPreferences?: DailyPreferencesDto[];
};

export function toUserSettingsDto(settings: UserSettings): UserSettingsDto {
  const snapshot = settings.toSnapshot();

  return {
    id: snapshot.id,
    weekStartDay: snapshot.weekStartDay,
    dailyPreferences: snapshot.dailyPreferences,
    tenantId: snapshot.tenantId,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}

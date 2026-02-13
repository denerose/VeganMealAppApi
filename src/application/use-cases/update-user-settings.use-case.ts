import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import type { UserSettings, DailyPreferences } from '@/domain/user/user-settings.entity';
import type { WeekStartDay } from '@/domain/shared/week-start-day.enum';

export type UpdateUserSettingsParams = {
  weekStartDay?: WeekStartDay;
  dailyPreferences?: DailyPreferences[];
};

export class UpdateUserSettingsUseCase {
  constructor(
    private userSettingsRepository: UserSettingsRepository,
    private userRepository: UserRepository
  ) {}

  async execute(
    userId: string,
    tenantId: string,
    params: UpdateUserSettingsParams
  ): Promise<UserSettings> {
    // Check if user is a tenant admin
    const isAdmin = await this.userRepository.isUserAdmin(userId, tenantId);
    if (!isAdmin) {
      throw new Error('Only tenant administrators can update user settings');
    }

    // Get existing settings or create new ones
    let settings = await this.userSettingsRepository.findByTenantId(tenantId);

    if (!settings) {
      // Create default settings if they don't exist
      const { UserSettings } = await import('@/domain/user/user-settings.entity');
      const { WeekStartDay } = await import('@/domain/shared/week-start-day.enum');
      
      settings = UserSettings.create(tenantId, WeekStartDay.MONDAY);
      settings = await this.userSettingsRepository.create(settings, tenantId);
    }

    // Apply updates
    if (params.weekStartDay !== undefined) {
      settings.updateWeekStartDay(params.weekStartDay);
    }

    if (params.dailyPreferences !== undefined) {
      settings.updateDailyPreferences(params.dailyPreferences);
    }

    // Save changes
    return await this.userSettingsRepository.save(settings, tenantId);
  }
}

import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import type { UserSettings } from '@/domain/user/user-settings.entity';

export class GetUserSettingsUseCase {
  constructor(
    private userSettingsRepository: UserSettingsRepository,
    private userRepository: UserRepository
  ) {}

  async execute(userId: string, tenantId: string): Promise<UserSettings> {
    // Verify user exists and belongs to tenant
    const user = await this.userRepository.findById(userId, tenantId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get or create user settings for the tenant
    let settings = await this.userSettingsRepository.findByTenantId(tenantId);

    if (!settings) {
      // Create default settings if they don't exist
      const { UserSettings } = await import('@/domain/user/user-settings.entity');
      const { WeekStartDay } = await import('@/domain/shared/week-start-day.enum');

      settings = UserSettings.create(tenantId, WeekStartDay.MONDAY);
      settings = await this.userSettingsRepository.create(settings, tenantId);
    }

    return settings;
  }
}

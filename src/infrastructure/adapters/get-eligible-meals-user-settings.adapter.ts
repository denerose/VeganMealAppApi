import type {
  UserSettingsRepository as EligibleUserSettingsRepository,
  UserSettings as EligibleUserSettings,
} from '@/application/meal/get-eligible-meals.usecase';
import type { UserSettingsRepository as DomainUserSettingsRepository } from '@/domain/user/user-settings.repository';

export class GetEligibleMealsUserSettingsRepositoryAdapter implements EligibleUserSettingsRepository {
  constructor(private readonly repository: DomainUserSettingsRepository) {}

  async findByTenantId(tenantId: string): Promise<EligibleUserSettings | null> {
    const settings = await this.repository.findByTenantId(tenantId);
    if (!settings || settings.id === null) {
      return null;
    }

    return {
      id: settings.id,
      tenantId: settings.tenantId,
      weekStartDay: settings.weekStartDay,
      dailyPreferences: settings.dailyPreferences.map(dp => ({
        day: dp.day,
        preferences: {
          ...dp.preferences,
        } as EligibleUserSettings['dailyPreferences'][number]['preferences'],
      })),
    };
  }
}

import type { UserSettings } from './user-settings.entity';

export interface UserSettingsRepository {
  findByTenantId(tenantId: string): Promise<UserSettings | null>;

  create(settings: UserSettings, tenantId: string): Promise<UserSettings>;

  save(settings: UserSettings, tenantId: string): Promise<UserSettings>;
}

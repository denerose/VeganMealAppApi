import type { PrismaClient, UserSettings as PrismaUserSettings } from '@prisma/client';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import type { UserSettings, DailyPreferences } from '@/domain/user/user-settings.entity';
import { UserSettings as UserSettingsEntity } from '@/domain/user/user-settings.entity';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

export class PrismaUserSettingsRepository implements UserSettingsRepository {
  constructor(private prisma: PrismaClient) {}

  async findByTenantId(tenantId: string): Promise<UserSettings | null> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { tenantId },
    });

    if (!settings) {
      return null;
    }

    return this.mapToEntity(settings);
  }

  async create(settings: UserSettings, tenantId: string): Promise<UserSettings> {
    // Verify settings belongs to the correct tenant
    if (settings.tenantId !== tenantId) {
      throw new Error('User settings tenantId mismatch');
    }

    const dbSettings = await this.prisma.userSettings.create({
      data: {
        tenantId,
        weekStartDay: settings.weekStartDay,
        dailyPreferences: settings.dailyPreferences as PrismaUserSettings['dailyPreferences'],
      },
    });

    // Return the mapped entity with the ID from database
    return this.mapToEntity(dbSettings);
  }

  async save(settings: UserSettings, tenantId: string): Promise<UserSettings> {
    // Verify settings belongs to the correct tenant
    if (settings.tenantId !== tenantId) {
      throw new Error('User settings tenantId mismatch');
    }

    const settingsId = settings.id;
    if (!settingsId) {
      throw new Error('Cannot save user settings without ID');
    }

    const dbSettings = await this.prisma.userSettings.update({
      where: { id: settingsId },
      data: {
        weekStartDay: settings.weekStartDay,
        dailyPreferences: settings.dailyPreferences as PrismaUserSettings['dailyPreferences'],
        updatedAt: settings.updatedAt,
      },
    });

    return this.mapToEntity(dbSettings);
  }

  private mapToEntity(dbSettings: PrismaUserSettings): UserSettings {
    return UserSettingsEntity.rehydrate({
      id: dbSettings.id,
      weekStartDay: dbSettings.weekStartDay as WeekStartDay,
      dailyPreferences: dbSettings.dailyPreferences as DailyPreferences[],
      tenantId: dbSettings.tenantId,
      createdAt: dbSettings.createdAt,
      updatedAt: dbSettings.updatedAt,
    });
  }
}

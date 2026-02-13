import { describe, expect, test, beforeEach } from 'bun:test';
import { resetDatabase, getTestPrisma } from '../../setup';
import { PrismaUserSettingsRepository } from '@/infrastructure/database/repositories/prisma-user-settings.repository';
import { UserSettings } from '@/domain/user/user-settings.entity';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';
import { DayOfWeek } from '@/domain/shared/day-of-week.enum';
import type { DailyPreferences } from '@/domain/user/user-settings.entity';

describe('PrismaUserSettingsRepository (integration)', () => {
  let repository: PrismaUserSettingsRepository;
  let prisma: ReturnType<typeof getTestPrisma>;

  beforeEach(async () => {
    await resetDatabase();
    prisma = getTestPrisma();
    repository = new PrismaUserSettingsRepository(prisma);
  });

  test('should create user settings', async () => {
    const tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Test Tenant',
      },
    });

    const settings = UserSettings.create(tenant.id, WeekStartDay.SUNDAY);
    const created = await repository.create(settings, tenant.id);

    expect(created.id).toBeDefined();
    expect(created.weekStartDay).toBe(WeekStartDay.SUNDAY);
    expect(created.dailyPreferences).toHaveLength(7);
    expect(created.tenantId).toBe(tenant.id);
  });

  test('should find user settings by tenantId', async () => {
    const tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Test Tenant',
      },
    });

    const settings = UserSettings.create(tenant.id, WeekStartDay.SATURDAY);
    await repository.create(settings, tenant.id);

    const found = await repository.findByTenantId(tenant.id);

    expect(found).toBeDefined();
    expect(found?.weekStartDay).toBe(WeekStartDay.SATURDAY);
    expect(found?.tenantId).toBe(tenant.id);
  });

  test('should return null if settings not found', async () => {
    const found = await repository.findByTenantId('non-existent-tenant');
    expect(found).toBeNull();
  });

  test('should save updated settings', async () => {
    const tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Test Tenant',
      },
    });

    let settings = UserSettings.create(tenant.id, WeekStartDay.MONDAY);
    settings = await repository.create(settings, tenant.id);

    settings.updateWeekStartDay(WeekStartDay.SUNDAY);

    const dailyPrefs: DailyPreferences[] = [
      { day: DayOfWeek.MONDAY, preferences: { isCreamy: true } },
      { day: DayOfWeek.TUESDAY, preferences: { isAcidic: false } },
      { day: DayOfWeek.WEDNESDAY, preferences: { greenVeg: true } },
      { day: DayOfWeek.THURSDAY, preferences: { isEasyToMake: true } },
      { day: DayOfWeek.FRIDAY, preferences: { needsPrep: false } },
      { day: DayOfWeek.SATURDAY, preferences: {} },
      { day: DayOfWeek.SUNDAY, preferences: {} },
    ];
    settings.updateDailyPreferences(dailyPrefs);

    const saved = await repository.save(settings, tenant.id);

    expect(saved.weekStartDay).toBe(WeekStartDay.SUNDAY);
    expect(saved.dailyPreferences).toHaveLength(7);
    
    const mondayPref = saved.dailyPreferences.find(p => p.day === DayOfWeek.MONDAY);
    expect(mondayPref?.preferences.isCreamy).toBe(true);
  });

  test('should throw error when saving settings with wrong tenantId', async () => {
    const tenant1 = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Tenant 1',
      },
    });

    const tenant2 = await prisma.tenant.create({
      data: {
        id: 'tenant-2',
        name: 'Tenant 2',
      },
    });

    let settings = UserSettings.create(tenant1.id);
    settings = await repository.create(settings, tenant1.id);

    await expect(repository.save(settings, tenant2.id)).rejects.toThrow(
      'User settings tenantId mismatch'
    );
  });

  test('should preserve custom daily preferences', async () => {
    const tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Test Tenant',
      },
    });

    const dailyPrefs: DailyPreferences[] = [
      { day: DayOfWeek.MONDAY, preferences: { isCreamy: true, greenVeg: true } },
      { day: DayOfWeek.TUESDAY, preferences: { isAcidic: true } },
      { day: DayOfWeek.WEDNESDAY, preferences: { isEasyToMake: true } },
      { day: DayOfWeek.THURSDAY, preferences: { needsPrep: true } },
      { day: DayOfWeek.FRIDAY, preferences: { isCreamy: false, isAcidic: false } },
      { day: DayOfWeek.SATURDAY, preferences: { greenVeg: true, needsPrep: false } },
      { day: DayOfWeek.SUNDAY, preferences: { isEasyToMake: false } },
    ];

    let settings = UserSettings.create(tenant.id);
    settings.updateDailyPreferences(dailyPrefs);
    settings = await repository.create(settings, tenant.id);

    const found = await repository.findByTenantId(tenant.id);

    expect(found?.dailyPreferences).toHaveLength(7);
    
    const monday = found?.dailyPreferences.find(p => p.day === DayOfWeek.MONDAY);
    expect(monday?.preferences.isCreamy).toBe(true);
    expect(monday?.preferences.greenVeg).toBe(true);
    
    const friday = found?.dailyPreferences.find(p => p.day === DayOfWeek.FRIDAY);
    expect(friday?.preferences.isCreamy).toBe(false);
    expect(friday?.preferences.isAcidic).toBe(false);
  });

  test('should enforce one settings per tenant', async () => {
    const tenant = await prisma.tenant.create({
      data: {
        id: 'tenant-1',
        name: 'Test Tenant',
      },
    });

    const settings1 = UserSettings.create(tenant.id);
    await repository.create(settings1, tenant.id);

    const settings2 = UserSettings.create(tenant.id, WeekStartDay.SUNDAY);

    // Should fail due to unique constraint on tenantId
    await expect(repository.create(settings2, tenant.id)).rejects.toThrow();
  });
});

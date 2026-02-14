import { describe, it, expect, beforeEach } from 'bun:test';

import { PrismaPlannedWeekRepository } from '@/infrastructure/database/repositories/prisma-planned-week.repository';
import { PlannedWeek } from '@/domain/planned-week/planned-week.entity';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';
import { DayOfWeek } from '@/domain/shared/day-of-week.enum';
import { ShortDay } from '@/domain/shared/short-day.enum';
import { resetDatabase, getTestPrisma } from '../../setup';

describe('PrismaPlannedWeekRepository', () => {
  const prisma = getTestPrisma();
  const repository = new PrismaPlannedWeekRepository(prisma);
  let testTenantId: string;

  beforeEach(async () => {
    await resetDatabase();

    // Create test tenant
    const tenant = await prisma.tenant.create({
      data: {
        name: 'Test Tenant',
      },
    });
    testTenantId = tenant.id;

    // Create user settings
    await prisma.userSettings.create({
      data: {
        tenantId: testTenantId,
        weekStartDay: WeekStartDay.MONDAY,
        dailyPreferences: [],
      },
    });
  });

  describe('create', () => {
    it('should persist a new planned week with day plans', async () => {
      const mondayDate = '2025-02-10'; // Monday
      const plannedWeek = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });

      const created = await repository.create(plannedWeek);

      expect(created.props.id).toBeDefined();
      expect(created.props.tenantId).toBe(testTenantId);
      expect(created.props.startingDate).toBe(mondayDate);
      expect(created.dayPlans).toHaveLength(7);

      // Verify first day plan
      expect(created.dayPlans[0].date).toBe(mondayDate);
      expect(created.dayPlans[0].longDay).toBe(DayOfWeek.MONDAY);
      expect(created.dayPlans[0].shortDay).toBe(ShortDay.MON);
    });

    it('should persist day plans with correct dates', async () => {
      const saturdayDate = '2025-02-15'; // Saturday
      const plannedWeek = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: saturdayDate,
        weekStartDay: WeekStartDay.SATURDAY,
      });

      const created = await repository.create(plannedWeek);

      expect(created.dayPlans[0].date).toBe('2025-02-15'); // Saturday
      expect(created.dayPlans[1].date).toBe('2025-02-16'); // Sunday
      expect(created.dayPlans[6].date).toBe('2025-02-21'); // Friday
    });
  });

  describe('findById', () => {
    it('should retrieve an existing planned week with all day plans', async () => {
      const mondayDate = '2025-02-10';
      const original = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });

      const created = await repository.create(original);
      const retrieved = await repository.findById(created.props.id!, testTenantId);

      expect(retrieved).not.toBeNull();
      expect(retrieved!.props.id).toBe(created.props.id);
      expect(retrieved!.props.startingDate).toBe(mondayDate);
      expect(retrieved!.dayPlans).toHaveLength(7);
    });

    it('should return null if planned week does not exist', async () => {
      const retrieved = await repository.findById('nonexistent-id', testTenantId);

      expect(retrieved).toBeNull();
    });

    it('should return null if tenant does not match', async () => {
      const mondayDate = '2025-02-10';
      const original = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });

      const created = await repository.create(original);
      const retrieved = await repository.findById(created.props.id!, 'different-tenant');

      expect(retrieved).toBeNull();
    });
  });

  describe('findByTenantAndStartDate', () => {
    it('should find planned week by tenant and start date', async () => {
      const mondayDate = '2025-02-10';
      const original = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });

      await repository.create(original);
      const found = await repository.findByTenantAndStartDate(testTenantId, mondayDate);

      expect(found).not.toBeNull();
      expect(found!.props.startingDate).toBe(mondayDate);
      expect(found!.props.tenantId).toBe(testTenantId);
    });

    it('should return null if no match found', async () => {
      const found = await repository.findByTenantAndStartDate(testTenantId, '2025-02-10');

      expect(found).toBeNull();
    });
  });

  describe('save', () => {
    it('should update day plan meal assignments', async () => {
      const mondayDate = '2025-02-10';
      const plannedWeek = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });

      const created = await repository.create(plannedWeek);

      // Create a test meal
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          nickname: 'Test User',
          tenantId: testTenantId,
        },
      });

      const meal = await prisma.meal.create({
        data: {
          mealName: 'Test Meal',
          tenantId: testTenantId,
          createdBy: user.id,
        },
      });

      // Assign meal to dinner
      created.assignMeal(mondayDate, 'dinner', {
        mealId: meal.id,
        makesLunch: true,
      });

      const updated = await repository.save(created);

      expect(updated.dayPlans[0].dinnerMealId).toBe(meal.id);
    });

    it('should preserve leftover state after save', async () => {
      const mondayDate = '2025-02-10';
      const plannedWeek = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });

      const created = await repository.create(plannedWeek);

      // Create a test meal
      const user = await prisma.user.create({
        data: {
          email: 'test@example.com',
          nickname: 'Test User',
          tenantId: testTenantId,
        },
      });

      const meal = await prisma.meal.create({
        data: {
          mealName: 'Makes Leftovers',
          tenantId: testTenantId,
          createdBy: user.id,
        },
      });

      // Assign dinner with makesLunch flag
      created.assignMeal(mondayDate, 'dinner', {
        mealId: meal.id,
        makesLunch: true,
      });

      // Populate leftovers
      created.populateLeftovers();

      const updated = await repository.save(created);
      const tuesday = updated.dayPlans[1];

      expect(tuesday.isLeftover).toBe(true);
      expect(tuesday.lunchMealId).toBe(meal.id);
    });
  });

  describe('delete', () => {
    it('should remove planned week and cascade to day plans', async () => {
      const mondayDate = '2025-02-10';
      const plannedWeek = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });

      const created = await repository.create(plannedWeek);
      await repository.delete(created.props.id!, testTenantId);

      const retrieved = await repository.findById(created.props.id!, testTenantId);
      expect(retrieved).toBeNull();

      // Verify day plans were also deleted
      const dayPlans = await prisma.dayPlan.findMany({
        where: { plannedWeekId: created.props.id! },
      });
      expect(dayPlans).toHaveLength(0);
    });

    it('should only delete within specified tenant', async () => {
      const mondayDate = '2025-02-10';

      // Create planned week for tenant 1
      const week1 = PlannedWeek.create({
        tenantId: testTenantId,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });
      const created1 = await repository.create(week1);

      // Create another tenant and planned week
      const tenant2 = await prisma.tenant.create({
        data: { name: 'Tenant 2' },
      });

      await prisma.userSettings.create({
        data: {
          tenantId: tenant2.id,
          weekStartDay: WeekStartDay.MONDAY,
          dailyPreferences: [],
        },
      });

      const week2 = PlannedWeek.create({
        tenantId: tenant2.id,
        startingDate: mondayDate,
        weekStartDay: WeekStartDay.MONDAY,
      });
      const created2 = await repository.create(week2);

      // Delete week 1
      await repository.delete(created1.props.id!, testTenantId);

      // Week 1 should be deleted
      const retrieved1 = await repository.findById(created1.props.id!, testTenantId);
      expect(retrieved1).toBeNull();

      // Week 2 should still exist
      const retrieved2 = await repository.findById(created2.props.id!, tenant2.id);
      expect(retrieved2).not.toBeNull();
    });
  });
});

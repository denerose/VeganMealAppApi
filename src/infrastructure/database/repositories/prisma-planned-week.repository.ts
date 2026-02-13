import type { PrismaClient, Prisma } from '@prisma/client';
import { format, parseISO } from 'date-fns';

import type {
  PlannedWeekRepository,
  PlannedWeekFilters,
  PaginationOptions,
} from '@/domain/planned-week/planned-week.repository';
import {
  type MealAssignment,
  PlannedWeek,
  type PlannedWeekSnapshot,
  type PlannedWeekProps,
} from '@/domain/planned-week/planned-week.entity';
import { DayOfWeek } from '@/domain/shared/day-of-week.enum';
import { ShortDay } from '@/domain/shared/short-day.enum';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

export class PrismaPlannedWeekRepository implements PlannedWeekRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(plannedWeek: PlannedWeek): Promise<PlannedWeek> {
    // We need to generate an ID first, then create the snapshot
    const tempId = crypto.randomUUID();

    // Assign the ID to the entity before creating snapshot
    (plannedWeek.props as PlannedWeekProps & { id: string }).id = tempId;
    const snapshot = plannedWeek.toSnapshot();

    const created = await this.prisma.plannedWeek.create({
      data: {
        id: tempId,
        tenantId: snapshot.tenantId,
        startingDate: parseISO(snapshot.startingDate),
        dayPlans: {
          create: snapshot.dayPlans.map(dayPlan => ({
            date: parseISO(dayPlan.date),
            longDay: dayPlan.longDay,
            shortDay: dayPlan.shortDay,
            lunchMealId: dayPlan.lunchMealId,
            dinnerMealId: dayPlan.dinnerMealId,
            isLeftover: dayPlan.isLeftover,
          })),
        },
      },
      include: {
        dayPlans: true,
      },
    });

    return this.toDomain(created, snapshot.weekStartDay, snapshot.dinnerAssignments);
  }

  async save(plannedWeek: PlannedWeek): Promise<PlannedWeek> {
    const snapshot = plannedWeek.toSnapshot();

    const updated = await this.prisma.$transaction(async tx => {
      await tx.plannedWeek.update({
        where: { id: snapshot.id },
        data: {
          startingDate: parseISO(snapshot.startingDate),
        },
      });

      for (const dayPlan of snapshot.dayPlans) {
        const existingDayPlan = await tx.dayPlan.findFirst({
          where: {
            plannedWeekId: snapshot.id,
            date: parseISO(dayPlan.date),
          },
        });

        if (existingDayPlan) {
          await tx.dayPlan.update({
            where: { id: existingDayPlan.id },
            data: {
              longDay: dayPlan.longDay,
              shortDay: dayPlan.shortDay,
              lunchMealId: dayPlan.lunchMealId,
              dinnerMealId: dayPlan.dinnerMealId,
              isLeftover: dayPlan.isLeftover,
            },
          });
        } else {
          await tx.dayPlan.create({
            data: {
              plannedWeekId: snapshot.id,
              date: parseISO(dayPlan.date),
              longDay: dayPlan.longDay,
              shortDay: dayPlan.shortDay,
              lunchMealId: dayPlan.lunchMealId,
              dinnerMealId: dayPlan.dinnerMealId,
              isLeftover: dayPlan.isLeftover,
            },
          });
        }
      }

      return tx.plannedWeek.findUniqueOrThrow({
        where: { id: snapshot.id },
        include: { dayPlans: true },
      });
    });

    return this.toDomain(updated, snapshot.weekStartDay, snapshot.dinnerAssignments);
  }

  async findById(id: string, tenantId: string): Promise<PlannedWeek | null> {
    const plannedWeek = await this.prisma.plannedWeek.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        dayPlans: true,
        tenant: {
          include: {
            userSettings: true,
          },
        },
      },
    });

    if (!plannedWeek) {
      return null;
    }

    const weekStartDay =
      (plannedWeek.tenant.userSettings?.weekStartDay as WeekStartDay) ?? WeekStartDay.MONDAY;

    return this.toDomain(plannedWeek, weekStartDay);
  }

  async findByTenantAndStartDate(
    tenantId: string,
    startingDate: string
  ): Promise<PlannedWeek | null> {
    const plannedWeek = await this.prisma.plannedWeek.findFirst({
      where: {
        tenantId,
        startingDate: parseISO(startingDate),
      },
      include: {
        dayPlans: true,
        tenant: {
          include: {
            userSettings: true,
          },
        },
      },
    });

    if (!plannedWeek) {
      return null;
    }

    const weekStartDay =
      (plannedWeek.tenant.userSettings?.weekStartDay as WeekStartDay) ?? WeekStartDay.MONDAY;

    return this.toDomain(plannedWeek, weekStartDay);
  }

  async findAll(
    tenantId: string,
    filters?: PlannedWeekFilters,
    pagination?: PaginationOptions
  ): Promise<{
    items: PlannedWeek[];
    total: number;
    limit: number;
    offset: number;
  }> {
    const where: Prisma.PlannedWeekWhereInput = {
      tenantId,
    };

    if (filters?.startDate || filters?.endDate) {
      where.startingDate = {};
      if (filters.startDate) {
        where.startingDate.gte = parseISO(filters.startDate);
      }
      if (filters.endDate) {
        where.startingDate.lte = parseISO(filters.endDate);
      }
    }

    const [plannedWeeks, total] = await Promise.all([
      this.prisma.plannedWeek.findMany({
        where,
        include: {
          dayPlans: true,
          tenant: {
            include: {
              userSettings: true,
            },
          },
        },
        skip: pagination?.offset ?? 0,
        take: pagination?.limit ?? 20,
        orderBy: {
          startingDate: 'desc',
        },
      }),
      this.prisma.plannedWeek.count({ where }),
    ]);

    return {
      items: plannedWeeks.map(pw =>
        this.toDomain(
          pw,
          (pw.tenant.userSettings?.weekStartDay as WeekStartDay) ?? WeekStartDay.MONDAY
        )
      ),
      total,
      limit: pagination?.limit ?? 20,
      offset: pagination?.offset ?? 0,
    };
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.plannedWeek.deleteMany({
      where: {
        id,
        tenantId,
      },
    });
  }

  private toDomain(
    prismaData: Prisma.PlannedWeekGetPayload<{ include: { dayPlans: true } }>,
    weekStartDay: WeekStartDay,
    dinnerAssignments?: Record<string, MealAssignment>
  ): PlannedWeek {
    const snapshot: PlannedWeekSnapshot = {
      id: prismaData.id,
      tenantId: prismaData.tenantId,
      startingDate: format(prismaData.startingDate, 'yyyy-MM-dd'),
      weekStartDay,
      dayPlans: prismaData.dayPlans.map(dayPlan => ({
        date: format(dayPlan.date, 'yyyy-MM-dd'),
        longDay: dayPlan.longDay as DayOfWeek,
        shortDay: dayPlan.shortDay as ShortDay,
        lunchMealId: dayPlan.lunchMealId,
        dinnerMealId: dayPlan.dinnerMealId,
        isLeftover: dayPlan.isLeftover,
      })),
      dinnerAssignments,
    };

    return PlannedWeek.rehydrate(snapshot);
  }
}

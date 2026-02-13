import type { PrismaClient } from '@prisma/client';
import { format, parseISO } from 'date-fns';

import type { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';
import {
  type MealAssignment,
  PlannedWeek,
  type PlannedWeekSnapshot,
} from '@/domain/planned-week/planned-week.entity';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

export class PrismaPlannedWeekRepository implements PlannedWeekRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(plannedWeek: PlannedWeek): Promise<PlannedWeek> {
    // We need to generate an ID first, then create the snapshot
    const tempId = crypto.randomUUID();
    
    // Assign the ID to the entity before creating snapshot
    (plannedWeek.props as any).id = tempId;
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
    startingDate: string,
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

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.plannedWeek.deleteMany({
      where: {
        id,
        tenantId,
      },
    });
  }

  private toDomain(
    prismaData: {
      id: string;
      tenantId: string;
      startingDate: Date;
      dayPlans: Array<{
        id: string;
        date: Date;
        longDay: string;
        shortDay: string;
        lunchMealId: string | null;
        dinnerMealId: string | null;
        isLeftover: boolean;
      }>;
    },
    weekStartDay: WeekStartDay,
    dinnerAssignments?: Record<string, MealAssignment>,
  ): PlannedWeek {
    const snapshot: PlannedWeekSnapshot = {
      id: prismaData.id,
      tenantId: prismaData.tenantId,
      startingDate: format(prismaData.startingDate, 'yyyy-MM-dd'),
      weekStartDay,
      dayPlans: prismaData.dayPlans.map(dayPlan => ({
        date: format(dayPlan.date, 'yyyy-MM-dd'),
        longDay: dayPlan.longDay as any,
        shortDay: dayPlan.shortDay as any,
        lunchMealId: dayPlan.lunchMealId,
        dinnerMealId: dayPlan.dinnerMealId,
        isLeftover: dayPlan.isLeftover,
      })),
      dinnerAssignments,
    };

    return PlannedWeek.rehydrate(snapshot);
  }
}

import { beforeEach, describe, expect, it } from 'bun:test';

import { AssignMealToDayUseCase } from '@/application/planned-week/assign-meal-to-day.usecase';
import { CreatePlannedWeekUseCase } from '@/application/planned-week/create-planned-week.usecase';
import { DeletePlannedWeekUseCase } from '@/application/planned-week/delete-planned-week.usecase';
import { GetPlannedWeekUseCase } from '@/application/planned-week/get-planned-week.usecase';
import { PopulateLeftoversUseCase } from '@/application/planned-week/populate-leftovers.usecase';
import { PlannedWeek, PlannedWeekProps } from '@/domain/planned-week/planned-week.entity';
import { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';
import { WeekStartDay } from '@/domain/shared/week-start-day.enum';

const createWeek = (overrides: Partial<PlannedWeekProps> = {}): PlannedWeek =>
  PlannedWeek.create({
    id: 'week-1',
    tenantId: 'tenant-1',
    startingDate: '2025-01-06',
    weekStartDay: WeekStartDay.MONDAY,
    ...overrides,
  });

class InMemoryPlannedWeekRepository implements PlannedWeekRepository {
  private readonly weeks = new Map<string, PlannedWeek>();
  public createdWeek: PlannedWeek | null = null;

  constructor(initialWeeks: PlannedWeek[] = []) {
    initialWeeks.forEach(week => {
      if (!week.props.id) {
        throw new Error('PlannedWeek must have an id for the in-memory repository');
      }
      this.weeks.set(week.props.id, week);
    });
  }

  create(plannedWeek: PlannedWeek): Promise<PlannedWeek> {
    const id = plannedWeek.props.id ?? crypto.randomUUID();
    (plannedWeek.props as { id?: string }).id = id;
    this.weeks.set(id, plannedWeek);
    this.createdWeek = plannedWeek;
    return Promise.resolve(plannedWeek);
  }

  save(plannedWeek: PlannedWeek): Promise<PlannedWeek> {
    if (!plannedWeek.props.id) {
      throw new Error('Cannot save planned week without identifier');
    }
    this.weeks.set(plannedWeek.props.id, plannedWeek);
    return Promise.resolve(plannedWeek);
  }

  findById(id: string, tenantId: string): Promise<PlannedWeek | null> {
    const week = this.weeks.get(id);
    return Promise.resolve(week && week.props.tenantId === tenantId ? week : null);
  }

  findByTenantAndStartDate(tenantId: string, startingDate: string): Promise<PlannedWeek | null> {
    for (const week of this.weeks.values()) {
      if (week.props.tenantId === tenantId && week.props.startingDate === startingDate) {
        return Promise.resolve(week);
      }
    }
    return Promise.resolve(null);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    const existing = await this.findById(id, tenantId);
    if (existing) {
      this.weeks.delete(id);
    }
  }
}

describe('Planned week use cases', () => {
  let repository: InMemoryPlannedWeekRepository;

  beforeEach(() => {
    repository = new InMemoryPlannedWeekRepository();
  });

  describe('CreatePlannedWeekUseCase', () => {
    const defaultRequest = {
      tenantId: 'tenant-1',
      startingDate: '2025-01-06',
      weekStartDay: WeekStartDay.MONDAY,
    };

    it('creates a planned week when no conflict exists', async () => {
      const useCase = new CreatePlannedWeekUseCase(repository);

      const plannedWeek = await useCase.execute(defaultRequest);

      expect(repository.createdWeek).not.toBeNull();
      expect(plannedWeek.props.startingDate).toBe(defaultRequest.startingDate);
    });

    it('prevents duplicate planned weeks for the same tenant and start date', () => {
      repository = new InMemoryPlannedWeekRepository([createWeek()]);
      const useCase = new CreatePlannedWeekUseCase(repository);

      return expect(useCase.execute(defaultRequest)).rejects.toThrow(
        'planned week already exists for this start date'
      );
    });
  });

  describe('AssignMealToDayUseCase', () => {
    it('assigns dinner meal and auto-populates leftovers for the next day', async () => {
      const week = createWeek();
      repository = new InMemoryPlannedWeekRepository([week]);
      const useCase = new AssignMealToDayUseCase(repository);

      const updated = await useCase.execute({
        tenantId: 'tenant-1',
        plannedWeekId: 'week-1',
        date: '2025-01-06',
        slot: 'dinner',
        meal: { mealId: 'meal-123', makesLunch: true },
      });

      expect(updated.getDayPlan('2025-01-06').dinnerMealId).toBe('meal-123');
      expect(updated.getDayPlan('2025-01-07').lunchMealId).toBe('meal-123');
      expect(updated.getDayPlan('2025-01-07').isLeftover).toBe(true);
    });

    it('throws when planned week is missing', () => {
      const useCase = new AssignMealToDayUseCase(repository);

      return expect(
        useCase.execute({
          tenantId: 'tenant-1',
          plannedWeekId: 'missing',
          date: '2025-01-06',
          slot: 'lunch',
          meal: { mealId: 'meal-1' },
        })
      ).rejects.toThrow('planned week not found');
    });
  });

  describe('GetPlannedWeekUseCase', () => {
    it('returns an existing planned week', async () => {
      const week = createWeek();
      repository = new InMemoryPlannedWeekRepository([week]);
      const useCase = new GetPlannedWeekUseCase(repository);

      const result = await useCase.execute({ tenantId: 'tenant-1', plannedWeekId: 'week-1' });
      expect(result).toBe(week);
    });
  });

  describe('DeletePlannedWeekUseCase', () => {
    it('deletes an existing planned week', async () => {
      const week = createWeek();
      repository = new InMemoryPlannedWeekRepository([week]);
      const useCase = new DeletePlannedWeekUseCase(repository);

      await useCase.execute({ tenantId: 'tenant-1', plannedWeekId: 'week-1' });

      return expect(repository.findById('week-1', 'tenant-1')).resolves.toBeNull();
    });
  });

  describe('PopulateLeftoversUseCase', () => {
    it('recomputes leftovers for existing planned week', async () => {
      const week = createWeek();
      week.assignMeal('2025-01-06', 'dinner', { mealId: 'meal-1', makesLunch: true });
      repository = new InMemoryPlannedWeekRepository([week]);
      const useCase = new PopulateLeftoversUseCase(repository);

      const updated = await useCase.execute({ tenantId: 'tenant-1', plannedWeekId: 'week-1' });

      expect(updated.getDayPlan('2025-01-07').lunchMealId).toBe('meal-1');
      expect(updated.getDayPlan('2025-01-07').isLeftover).toBe(true);
    });
  });
});

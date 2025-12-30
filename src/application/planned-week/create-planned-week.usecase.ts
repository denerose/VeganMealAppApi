import { PlannedWeek, PlannedWeekProps } from '@/domain/planned-week/planned-week.entity';
import { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';

export type CreatePlannedWeekRequest = PlannedWeekProps;

export class CreatePlannedWeekUseCase {
  constructor(private readonly plannedWeekRepository: PlannedWeekRepository) {}

  async execute(request: CreatePlannedWeekRequest): Promise<PlannedWeek> {
    const existingWeek = await this.plannedWeekRepository.findByTenantAndStartDate(
      request.tenantId,
      request.startingDate,
    );

    if (existingWeek) {
      throw new Error('planned week already exists for this start date');
    }

    const plannedWeek = PlannedWeek.create(request);
    return this.plannedWeekRepository.create(plannedWeek);
  }
}

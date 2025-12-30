import { PlannedWeek } from '@/domain/planned-week/planned-week.entity';
import { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';

export type GetPlannedWeekRequest = {
  tenantId: string;
  plannedWeekId: string;
};

export class GetPlannedWeekUseCase {
  constructor(private readonly plannedWeekRepository: PlannedWeekRepository) {}

  async execute(request: GetPlannedWeekRequest): Promise<PlannedWeek> {
    const plannedWeek = await this.plannedWeekRepository.findById(
      request.plannedWeekId,
      request.tenantId,
    );

    if (!plannedWeek) {
      throw new Error('planned week not found');
    }

    return plannedWeek;
  }
}

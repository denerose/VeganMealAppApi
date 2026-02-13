import { PlannedWeek } from '@/domain/planned-week/planned-week.entity';
import { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';

export type PopulateLeftoversRequest = {
  tenantId: string;
  plannedWeekId: string;
};

export class PopulateLeftoversUseCase {
  constructor(private readonly plannedWeekRepository: PlannedWeekRepository) {}

  async execute(request: PopulateLeftoversRequest): Promise<PlannedWeek> {
    const plannedWeek = await this.plannedWeekRepository.findById(
      request.plannedWeekId,
      request.tenantId
    );

    if (!plannedWeek) {
      throw new Error('planned week not found');
    }

    plannedWeek.populateLeftovers();
    return this.plannedWeekRepository.save(plannedWeek);
  }
}

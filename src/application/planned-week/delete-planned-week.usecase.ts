import { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';

export type DeletePlannedWeekRequest = {
  tenantId: string;
  plannedWeekId: string;
};

export class DeletePlannedWeekUseCase {
  constructor(private readonly plannedWeekRepository: PlannedWeekRepository) {}

  async execute(request: DeletePlannedWeekRequest): Promise<void> {
    const plannedWeek = await this.plannedWeekRepository.findById(
      request.plannedWeekId,
      request.tenantId,
    );

    if (!plannedWeek) {
      throw new Error('planned week not found');
    }

    await this.plannedWeekRepository.delete(request.plannedWeekId, request.tenantId);
  }
}

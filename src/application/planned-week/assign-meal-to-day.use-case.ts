import { MealAssignment, PlannedWeek } from '@/domain/planned-week/planned-week.entity';
import { MealSlot } from '@/domain/shared/meal-slot.enum';
import { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';

export type AssignMealToDayRequest = {
  tenantId: string;
  plannedWeekId: string;
  date: string;
  slot: MealSlot;
  meal?: MealAssignment;
};

export class AssignMealToDayUseCase {
  constructor(private readonly plannedWeekRepository: PlannedWeekRepository) {}

  async execute(request: AssignMealToDayRequest): Promise<PlannedWeek> {
    const plannedWeek = await this.ensurePlannedWeekExists(request.plannedWeekId, request.tenantId);

    if (request.meal) {
      plannedWeek.assignMeal(request.date, request.slot, request.meal);
    } else {
      plannedWeek.removeMeal(request.date, request.slot);
    }

    if (request.slot === MealSlot.DINNER) {
      plannedWeek.populateLeftovers();
    }

    return this.plannedWeekRepository.save(plannedWeek);
  }

  private async ensurePlannedWeekExists(
    plannedWeekId: string,
    tenantId: string
  ): Promise<PlannedWeek> {
    const plannedWeek = await this.plannedWeekRepository.findById(plannedWeekId, tenantId);

    if (!plannedWeek) {
      throw new Error('planned week not found');
    }

    return plannedWeek;
  }
}

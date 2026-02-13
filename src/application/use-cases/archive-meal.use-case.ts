import type { MealId, MealSnapshot } from '../../domain/meal/meal.entity';
import type { MealRepository } from '../../domain/meal/meal.repository';

export type ArchiveMealRequest = {
  id: MealId;
  tenantId: string;
};

export class ArchiveMealUseCase {
  constructor(private mealRepository: MealRepository) {}

  async execute(request: ArchiveMealRequest): Promise<MealSnapshot> {
    const meal = await this.mealRepository.findById(request.id, request.tenantId);

    if (!meal) {
      throw new Error(`Meal with ID ${request.id} not found`);
    }

    meal.archive();

    const savedMeal = await this.mealRepository.save(meal, request.tenantId);
    return savedMeal.toSnapshot();
  }
}

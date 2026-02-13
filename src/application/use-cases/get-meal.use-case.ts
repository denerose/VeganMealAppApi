import type { MealId, MealSnapshot } from '../../domain/meal/meal.entity';
import type { MealRepository } from '../../domain/meal/meal.repository';

export type GetMealRequest = {
  id: MealId;
  tenantId: string;
};

export class GetMealUseCase {
  constructor(private mealRepository: MealRepository) {}

  async execute(request: GetMealRequest): Promise<MealSnapshot> {
    const meal = await this.mealRepository.findById(request.id, request.tenantId);

    if (!meal) {
      throw new Error(`Meal with ID ${request.id} not found`);
    }

    return meal.toSnapshot();
  }
}

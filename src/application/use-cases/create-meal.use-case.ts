import { Meal, type MealSnapshot } from '../../domain/meal/meal.entity';
import type { MealRepository } from '../../domain/meal/meal.repository';
import type { MealQualitiesProps } from '../../domain/meal/meal-qualities.vo';
import type { IngredientId } from '../../domain/ingredient/ingredient.entity';

export type CreateMealRequest = {
  name: string;
  qualities?: Partial<MealQualitiesProps>;
  ingredientIds?: IngredientId[];
  tenantId: string;
  createdBy?: string;
};

export class CreateMealUseCase {
  constructor(private mealRepository: MealRepository) {}

  async execute(request: CreateMealRequest): Promise<MealSnapshot> {
    const meal = Meal.create(request.name, request.qualities, request.ingredientIds);

    const savedMeal = await this.mealRepository.create(meal, request.tenantId, request.createdBy);
    return savedMeal.toSnapshot();
  }
}

import type { MealSummary } from '@/domain/meal/meal.repository';
import type { MealSlot } from '@/domain/planned-week/planned-week.entity';
import type { GetEligibleMealsUseCase } from './get-eligible-meals.usecase';

export type GetRandomMealRequest = {
  tenantId: string;
  date: string;
  mealType: MealSlot;
};

export class GetRandomMealUseCase {
  constructor(private readonly getEligibleMealsUseCase: GetEligibleMealsUseCase) {}

  async execute(request: GetRandomMealRequest): Promise<MealSummary | null> {
    const eligibleMeals = await this.getEligibleMealsUseCase.execute(request);

    if (eligibleMeals.length === 0) {
      return null;
    }

    // Select a random meal from the eligible meals
    const randomIndex = Math.floor(Math.random() * eligibleMeals.length);
    return eligibleMeals[randomIndex];
  }
}

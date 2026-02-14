import type { MealSnapshot } from '@/domain/meal/meal.entity';
import type {
  MealRepository,
  MealFilters,
  PaginationOptions,
  PaginatedResult,
} from '@/domain/meal/meal.repository';

export type ListMealsRequest = {
  tenantId: string;
  filters?: MealFilters;
  pagination?: PaginationOptions;
};

export class ListMealsUseCase {
  constructor(private readonly mealRepository: MealRepository) {}

  async execute(request: ListMealsRequest): Promise<PaginatedResult<MealSnapshot>> {
    const result = await this.mealRepository.findAll(
      request.tenantId,
      request.filters,
      request.pagination
    );

    return {
      items: result.items.map(meal => meal.toSnapshot()),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }
}

import type { IngredientSnapshot } from '@/domain/ingredient/ingredient.entity';
import type {
  IngredientRepository,
  IngredientFilters,
  PaginationOptions,
  PaginatedResult,
} from '@/domain/ingredient/ingredient.repository';

export type ListIngredientsRequest = {
  tenantId: string;
  filters?: IngredientFilters;
  pagination?: PaginationOptions;
};

export class ListIngredientsUseCase {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async execute(request: ListIngredientsRequest): Promise<PaginatedResult<IngredientSnapshot>> {
    const result = await this.ingredientRepository.findAll(
      request.tenantId,
      request.filters,
      request.pagination
    );

    return {
      items: result.items.map(ingredient => ingredient.toSnapshot()),
      total: result.total,
      limit: result.limit,
      offset: result.offset,
    };
  }
}

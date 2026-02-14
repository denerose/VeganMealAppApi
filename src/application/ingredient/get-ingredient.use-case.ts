import type { IngredientId, IngredientSnapshot } from '@/domain/ingredient/ingredient.entity';
import type { IngredientRepository } from '@/domain/ingredient/ingredient.repository';

export type GetIngredientRequest = {
  id: IngredientId;
  tenantId: string;
};

export class GetIngredientUseCase {
  constructor(private readonly ingredientRepository: IngredientRepository) {}

  async execute(request: GetIngredientRequest): Promise<IngredientSnapshot> {
    const ingredient = await this.ingredientRepository.findById(request.id, request.tenantId);

    if (!ingredient) {
      throw new Error(`Ingredient with ID ${request.id} not found`);
    }

    return ingredient.toSnapshot();
  }
}

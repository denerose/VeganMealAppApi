import type { IngredientId } from '../../domain/ingredient/ingredient.entity';
import type { IngredientRepository } from '../../domain/ingredient/ingredient.repository';

export type DeleteIngredientRequest = {
  id: IngredientId;
  tenantId: string;
};

export class DeleteIngredientUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: DeleteIngredientRequest): Promise<void> {
    const ingredient = await this.ingredientRepository.findById(
      request.id,
      request.tenantId
    );
    
    if (!ingredient) {
      throw new Error(`Ingredient with ID ${request.id} not found`);
    }

    await this.ingredientRepository.delete(request.id, request.tenantId);
  }
}

import type { IngredientId, IngredientSnapshot } from '../../domain/ingredient/ingredient.entity';
import type { IngredientRepository } from '../../domain/ingredient/ingredient.repository';
import type { StorageType } from '../../domain/shared/storage-type.enum';

export type UpdateIngredientRequest = {
  id: IngredientId;
  tenantId: string;
  name?: string;
  storageType?: StorageType;
  isStaple?: boolean;
};

export class UpdateIngredientUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: UpdateIngredientRequest): Promise<IngredientSnapshot> {
    const ingredient = await this.ingredientRepository.findById(
      request.id,
      request.tenantId
    );
    
    if (!ingredient) {
      throw new Error(`Ingredient with ID ${request.id} not found`);
    }

    if (request.name !== undefined) {
      ingredient.updateName(request.name);
    }

    if (request.storageType !== undefined) {
      ingredient.updateStorageType(request.storageType);
    }

    if (request.isStaple !== undefined) {
      ingredient.setStaple(request.isStaple);
    }

    const savedIngredient = await this.ingredientRepository.save(
      ingredient,
      request.tenantId
    );
    return savedIngredient.toSnapshot();
  }
}

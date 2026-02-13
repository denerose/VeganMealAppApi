import { Ingredient, type IngredientSnapshot } from '../../domain/ingredient/ingredient.entity';
import type { IngredientRepository } from '../../domain/ingredient/ingredient.repository';
import type { StorageType } from '../../domain/shared/storage-type.enum';

export type CreateIngredientRequest = {
  name: string;
  storageType: StorageType;
  isStaple?: boolean;
  tenantId: string;
};

export class CreateIngredientUseCase {
  constructor(private ingredientRepository: IngredientRepository) {}

  async execute(request: CreateIngredientRequest): Promise<IngredientSnapshot> {
    const ingredient = Ingredient.create(request.name, request.storageType, request.isStaple);

    const savedIngredient = await this.ingredientRepository.create(ingredient, request.tenantId);
    return savedIngredient.toSnapshot();
  }
}

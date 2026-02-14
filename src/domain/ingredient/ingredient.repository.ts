import type { PaginationOptions, PaginatedResult } from '@/domain/shared/pagination.types';
import type { Ingredient, IngredientId } from './ingredient.entity';
import type { StorageType } from '../shared/storage-type.enum';

export type IngredientFilters = {
  name?: string;
  storageType?: StorageType;
  isStaple?: boolean;
};

export type { PaginationOptions, PaginatedResult };

export interface IngredientRepository {
  create(ingredient: Ingredient, tenantId: string): Promise<Ingredient>;

  findById(id: IngredientId, tenantId: string): Promise<Ingredient | null>;

  findAll(
    tenantId: string,
    filters?: IngredientFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Ingredient>>;

  save(ingredient: Ingredient, tenantId: string): Promise<Ingredient>;

  delete(id: IngredientId, tenantId: string): Promise<void>;
}

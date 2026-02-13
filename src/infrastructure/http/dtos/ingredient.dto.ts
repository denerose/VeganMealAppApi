import { StorageType, STORAGE_TYPE_VALUES } from '@/domain/shared/storage-type.enum';

export type CreateIngredientRequestDto = {
  name: string;
  storageType: StorageType;
  isStaple?: boolean;
};

export type UpdateIngredientRequestDto = {
  name?: string;
  storageType?: StorageType;
  isStaple?: boolean;
};

export type IngredientResponseDto = {
  id: string;
  name: string;
  storageType: StorageType;
  isStaple: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedIngredientsResponseDto = {
  items: IngredientResponseDto[];
  total: number;
  limit: number;
  offset: number;
};

export function validateCreateIngredientRequest(data: any): CreateIngredientRequestDto {
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Invalid request: name is required and must be a string');
  }

  if (!data.storageType || typeof data.storageType !== 'string') {
    throw new Error('Invalid request: storageType is required and must be a string');
  }

  if (!STORAGE_TYPE_VALUES.includes(data.storageType as StorageType)) {
    throw new Error(
      `Invalid request: storageType must be one of ${STORAGE_TYPE_VALUES.join(', ')}`
    );
  }

  const request: CreateIngredientRequestDto = {
    name: data.name,
    storageType: data.storageType as StorageType,
  };

  if (data.isStaple !== undefined) {
    if (typeof data.isStaple !== 'boolean') {
      throw new Error('Invalid request: isStaple must be a boolean');
    }
    request.isStaple = data.isStaple;
  }

  return request;
}

export function validateUpdateIngredientRequest(data: any): UpdateIngredientRequestDto {
  const request: UpdateIngredientRequestDto = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      throw new Error('Invalid request: name must be a string');
    }
    request.name = data.name;
  }

  if (data.storageType !== undefined) {
    if (typeof data.storageType !== 'string') {
      throw new Error('Invalid request: storageType must be a string');
    }
    if (!STORAGE_TYPE_VALUES.includes(data.storageType as StorageType)) {
      throw new Error(
        `Invalid request: storageType must be one of ${STORAGE_TYPE_VALUES.join(', ')}`
      );
    }
    request.storageType = data.storageType as StorageType;
  }

  if (data.isStaple !== undefined) {
    if (typeof data.isStaple !== 'boolean') {
      throw new Error('Invalid request: isStaple must be a boolean');
    }
    request.isStaple = data.isStaple;
  }

  return request;
}

export function toIngredientResponseDto(snapshot: any): IngredientResponseDto {
  return {
    id: snapshot.id,
    name: snapshot.name,
    storageType: snapshot.storageType,
    isStaple: snapshot.isStaple,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}

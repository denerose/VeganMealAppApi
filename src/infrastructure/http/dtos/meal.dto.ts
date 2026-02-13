import type { MealSnapshot } from '@/domain/meal/meal.entity';
import type { MealQualitiesProps } from '@/domain/meal/meal-qualities.vo';

function isRecord(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null;
}

export type CreateMealRequestDto = {
  name: string;
  qualities?: Partial<MealQualitiesProps>;
  ingredientIds?: string[];
};

export type UpdateMealRequestDto = {
  name?: string;
  qualities?: Partial<MealQualitiesProps>;
  ingredientIds?: string[];
};

export type MealQualitiesDto = {
  isDinner: boolean;
  isLunch: boolean;
  isCreamy: boolean;
  isAcidic: boolean;
  greenVeg: boolean;
  makesLunch: boolean;
  isEasyToMake: boolean;
  needsPrep: boolean;
};

export type MealResponseDto = {
  id: string;
  name: string;
  qualities: MealQualitiesDto;
  ingredientIds: string[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PaginatedMealsResponseDto = {
  items: MealResponseDto[];
  total: number;
  limit: number;
  offset: number;
};

export function validateCreateMealRequest(data: unknown): CreateMealRequestDto {
  if (!isRecord(data)) {
    throw new Error('Invalid request: body must be an object');
  }
  if (!data.name || typeof data.name !== 'string') {
    throw new Error('Invalid request: name is required and must be a string');
  }

  const request: CreateMealRequestDto = {
    name: data.name,
  };

  if (data.qualities) {
    if (typeof data.qualities !== 'object' || data.qualities === null) {
      throw new Error('Invalid request: qualities must be an object');
    }
    request.qualities = validateMealQualities(data.qualities as Record<string, unknown>);
  }

  if (data.ingredientIds) {
    if (!Array.isArray(data.ingredientIds)) {
      throw new Error('Invalid request: ingredientIds must be an array');
    }
    if (!(data.ingredientIds as unknown[]).every((id: unknown) => typeof id === 'string')) {
      throw new Error('Invalid request: all ingredientIds must be strings');
    }
    request.ingredientIds = data.ingredientIds as string[];
  }

  return request;
}

export function validateUpdateMealRequest(data: unknown): UpdateMealRequestDto {
  if (!isRecord(data)) {
    throw new Error('Invalid request: body must be an object');
  }
  const request: UpdateMealRequestDto = {};

  if (data.name !== undefined) {
    if (typeof data.name !== 'string') {
      throw new Error('Invalid request: name must be a string');
    }
    request.name = data.name;
  }

  if (data.qualities !== undefined) {
    if (typeof data.qualities !== 'object' || data.qualities === null) {
      throw new Error('Invalid request: qualities must be an object');
    }
    request.qualities = validateMealQualities(data.qualities as Record<string, unknown>);
  }

  if (data.ingredientIds !== undefined) {
    if (!Array.isArray(data.ingredientIds)) {
      throw new Error('Invalid request: ingredientIds must be an array');
    }
    if (!(data.ingredientIds as unknown[]).every((id: unknown) => typeof id === 'string')) {
      throw new Error('Invalid request: all ingredientIds must be strings');
    }
    request.ingredientIds = data.ingredientIds as string[];
  }

  return request;
}

function validateMealQualities(data: Record<string, unknown>): Partial<MealQualitiesProps> {
  const qualities: Partial<MealQualitiesProps> = {};

  if (data.isDinner !== undefined) {
    if (typeof data.isDinner !== 'boolean') {
      throw new Error('Invalid request: isDinner must be a boolean');
    }
    qualities.isDinner = data.isDinner;
  }

  if (data.isLunch !== undefined) {
    if (typeof data.isLunch !== 'boolean') {
      throw new Error('Invalid request: isLunch must be a boolean');
    }
    qualities.isLunch = data.isLunch;
  }

  if (data.isCreamy !== undefined) {
    if (typeof data.isCreamy !== 'boolean') {
      throw new Error('Invalid request: isCreamy must be a boolean');
    }
    qualities.isCreamy = data.isCreamy;
  }

  if (data.isAcidic !== undefined) {
    if (typeof data.isAcidic !== 'boolean') {
      throw new Error('Invalid request: isAcidic must be a boolean');
    }
    qualities.isAcidic = data.isAcidic;
  }

  if (data.greenVeg !== undefined) {
    if (typeof data.greenVeg !== 'boolean') {
      throw new Error('Invalid request: greenVeg must be a boolean');
    }
    qualities.greenVeg = data.greenVeg;
  }

  if (data.makesLunch !== undefined) {
    if (typeof data.makesLunch !== 'boolean') {
      throw new Error('Invalid request: makesLunch must be a boolean');
    }
    qualities.makesLunch = data.makesLunch;
  }

  if (data.isEasyToMake !== undefined) {
    if (typeof data.isEasyToMake !== 'boolean') {
      throw new Error('Invalid request: isEasyToMake must be a boolean');
    }
    qualities.isEasyToMake = data.isEasyToMake;
  }

  if (data.needsPrep !== undefined) {
    if (typeof data.needsPrep !== 'boolean') {
      throw new Error('Invalid request: needsPrep must be a boolean');
    }
    qualities.needsPrep = data.needsPrep;
  }

  return qualities;
}

export function toMealResponseDto(snapshot: MealSnapshot): MealResponseDto {
  return {
    id: snapshot.id,
    name: snapshot.name,
    qualities: {
      isDinner: snapshot.qualities.isDinner,
      isLunch: snapshot.qualities.isLunch,
      isCreamy: snapshot.qualities.isCreamy,
      isAcidic: snapshot.qualities.isAcidic,
      greenVeg: snapshot.qualities.greenVeg,
      makesLunch: snapshot.qualities.makesLunch,
      isEasyToMake: snapshot.qualities.isEasyToMake,
      needsPrep: snapshot.qualities.needsPrep,
    },
    ingredientIds: snapshot.ingredientIds,
    archivedAt: snapshot.archivedAt ? snapshot.archivedAt.toISOString() : null,
    createdAt: snapshot.createdAt.toISOString(),
    updatedAt: snapshot.updatedAt.toISOString(),
  };
}

import type { Meal, MealId } from './meal.entity';
import type { MealQualitiesProps } from './meal-qualities.vo';

export type MealFilters = {
  name?: string;
  isDinner?: boolean;
  isLunch?: boolean;
  isCreamy?: boolean;
  isAcidic?: boolean;
  greenVeg?: boolean;
  makesLunch?: boolean;
  isEasyToMake?: boolean;
  needsPrep?: boolean;
  includeArchived?: boolean;
};

export type PaginationOptions = {
  limit: number;
  offset: number;
};

export type PaginatedResult<T> = {
  items: T[];
  total: number;
  limit: number;
  offset: number;
};

export type MealQualitiesFilter = Partial<MealQualitiesProps> & {
  isArchived?: boolean;
};

export type MealSummary = {
  id: string;
  mealName: string;
  qualities: MealQualitiesProps;
};

export interface MealRepository {
  create(meal: Meal, tenantId: string, createdBy?: string): Promise<Meal>;
  
  findById(id: MealId, tenantId: string): Promise<Meal | null>;
  
  findAll(
    tenantId: string,
    filters?: MealFilters,
    pagination?: PaginationOptions
  ): Promise<PaginatedResult<Meal>>;
  
  save(meal: Meal, tenantId: string): Promise<Meal>;
  
  delete(id: MealId, tenantId: string): Promise<void>;

  // Added for GetEligibleMealsUseCase compatibility
  findByQualities(
    tenantId: string,
    filter: MealQualitiesFilter
  ): Promise<MealSummary[]>;
}

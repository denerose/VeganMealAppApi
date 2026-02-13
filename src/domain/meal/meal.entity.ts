import { MealQualities, type MealQualitiesProps } from './meal-qualities.vo';
import type { IngredientId } from '../ingredient/ingredient.entity';

export type MealId = string;

export type MealSnapshot = {
  id: MealId;
  name: string;
  qualities: MealQualitiesProps;
  ingredientIds: IngredientId[];
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export class Meal {
  private constructor(
    private _id: MealId | null,
    private _name: string,
    private _qualities: MealQualities,
    private _ingredientIds: IngredientId[],
    private _archivedAt: Date | null,
    private _createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(
    name: string,
    qualities?: Partial<MealQualitiesProps>,
    ingredientIds: IngredientId[] = []
  ): Meal {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Meal name cannot be empty');
    }

    return new Meal(
      null,
      trimmedName,
      MealQualities.create(qualities),
      ingredientIds,
      null,
      new Date(),
      new Date()
    );
  }

  static rehydrate(snapshot: MealSnapshot): Meal {
    return new Meal(
      snapshot.id,
      snapshot.name,
      MealQualities.rehydrate(snapshot.qualities),
      snapshot.ingredientIds,
      snapshot.archivedAt,
      snapshot.createdAt,
      snapshot.updatedAt
    );
  }

  get id(): MealId | null {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get qualities(): MealQualities {
    return this._qualities;
  }

  get ingredientIds(): IngredientId[] {
    return [...this._ingredientIds];
  }

  get archivedAt(): Date | null {
    return this._archivedAt;
  }

  get isArchived(): boolean {
    return this._archivedAt !== null;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  updateName(name: string): void {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Meal name cannot be empty');
    }
    this._name = trimmedName;
    this._updatedAt = new Date();
  }

  updateQualities(updates: Partial<MealQualitiesProps>): void {
    this._qualities = this._qualities.update(updates);
    this._updatedAt = new Date();
  }

  addIngredient(ingredientId: IngredientId): void {
    if (!this._ingredientIds.includes(ingredientId)) {
      this._ingredientIds.push(ingredientId);
      this._updatedAt = new Date();
    }
  }

  removeIngredient(ingredientId: IngredientId): void {
    const index = this._ingredientIds.indexOf(ingredientId);
    if (index !== -1) {
      this._ingredientIds.splice(index, 1);
      this._updatedAt = new Date();
    }
  }

  setIngredients(ingredientIds: IngredientId[]): void {
    this._ingredientIds = [...ingredientIds];
    this._updatedAt = new Date();
  }

  archive(): void {
    if (this._archivedAt === null) {
      this._archivedAt = new Date();
      this._updatedAt = new Date();
    }
  }

  restore(): void {
    if (this._archivedAt !== null) {
      this._archivedAt = null;
      this._updatedAt = new Date();
    }
  }

  assignId(id: MealId): void {
    if (this._id !== null) {
      throw new Error('Cannot reassign ID to a meal that already has one');
    }
    this._id = id;
  }

  toSnapshot(): MealSnapshot {
    if (this._id === null) {
      throw new Error('Cannot create snapshot without a persistent identifier');
    }

    return {
      id: this._id,
      name: this._name,
      qualities: this._qualities.toObject(),
      ingredientIds: [...this._ingredientIds],
      archivedAt: this._archivedAt,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

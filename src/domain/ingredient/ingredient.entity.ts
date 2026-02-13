import { StorageType, STORAGE_TYPE_VALUES } from '../shared/storage-type.enum';

export type IngredientId = string;

export type IngredientSnapshot = {
  id: IngredientId;
  name: string;
  storageType: StorageType;
  isStaple: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export class Ingredient {
  private constructor(
    private _id: IngredientId | null,
    private _name: string,
    private _storageType: StorageType,
    private _isStaple: boolean,
    private _createdAt: Date,
    private _updatedAt: Date
  ) {}

  static create(name: string, storageType: StorageType, isStaple: boolean = false): Ingredient {
    const trimmedName = name.trim();
    if (!trimmedName) {
      throw new Error('Ingredient name cannot be empty');
    }

    if (!STORAGE_TYPE_VALUES.includes(storageType)) {
      throw new Error(
        `Invalid storage type. Must be one of: ${STORAGE_TYPE_VALUES.join(', ')}`
      );
    }

    return new Ingredient(null, trimmedName, storageType, isStaple, new Date(), new Date());
  }

  static rehydrate(snapshot: IngredientSnapshot): Ingredient {
    return new Ingredient(
      snapshot.id,
      snapshot.name,
      snapshot.storageType,
      snapshot.isStaple,
      snapshot.createdAt,
      snapshot.updatedAt
    );
  }

  get id(): IngredientId | null {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get storageType(): StorageType {
    return this._storageType;
  }

  get isStaple(): boolean {
    return this._isStaple;
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
      throw new Error('Ingredient name cannot be empty');
    }
    this._name = trimmedName;
    this._updatedAt = new Date();
  }

  updateStorageType(storageType: StorageType): void {
    if (!STORAGE_TYPE_VALUES.includes(storageType)) {
      throw new Error(
        `Invalid storage type. Must be one of: ${STORAGE_TYPE_VALUES.join(', ')}`
      );
    }
    this._storageType = storageType;
    this._updatedAt = new Date();
  }

  setStaple(isStaple: boolean): void {
    this._isStaple = isStaple;
    this._updatedAt = new Date();
  }

  assignId(id: IngredientId): void {
    if (this._id !== null) {
      throw new Error('Cannot reassign ID to an ingredient that already has one');
    }
    this._id = id;
  }

  toSnapshot(): IngredientSnapshot {
    if (this._id === null) {
      throw new Error('Cannot create snapshot without a persistent identifier');
    }

    return {
      id: this._id,
      name: this._name,
      storageType: this._storageType,
      isStaple: this._isStaple,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

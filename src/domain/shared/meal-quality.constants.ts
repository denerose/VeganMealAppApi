import type { MealQualitiesProps } from '@/domain/meal/meal-qualities.vo';

/** All meal quality keys used for filtering meals (e.g. in findByQualities). */
export const MEAL_QUALITY_KEYS: ReadonlyArray<keyof MealQualitiesProps> = [
  'isCreamy',
  'isAcidic',
  'greenVeg',
  'makesLunch',
  'isEasyToMake',
  'needsPrep',
] as const;

/** All keys of MealQualitiesProps (for building repository where.qualities from filter). */
export const MEAL_QUALITIES_FILTER_KEYS: ReadonlyArray<keyof MealQualitiesProps> = [
  'isDinner',
  'isLunch',
  'isCreamy',
  'isAcidic',
  'greenVeg',
  'makesLunch',
  'isEasyToMake',
  'needsPrep',
] as const;

/** Keys used in daily preferences (excludes makesLunch). */
export const DAILY_PREFERENCE_KEYS: ReadonlyArray<
  Exclude<keyof MealQualitiesProps, 'isDinner' | 'isLunch' | 'makesLunch'>
> = ['isCreamy', 'isAcidic', 'greenVeg', 'isEasyToMake', 'needsPrep'] as const;

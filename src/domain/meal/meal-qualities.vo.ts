export type MealQualitiesProps = {
  isDinner: boolean;
  isLunch: boolean;
  isCreamy: boolean;
  isAcidic: boolean;
  greenVeg: boolean;
  makesLunch: boolean;
  isEasyToMake: boolean;
  needsPrep: boolean;
};

export class MealQualities {
  private constructor(public readonly props: MealQualitiesProps) {}

  static create(props: Partial<MealQualitiesProps> = {}): MealQualities {
    const qualities: MealQualitiesProps = {
      isDinner: props.isDinner ?? true,
      isLunch: props.isLunch ?? false,
      isCreamy: props.isCreamy ?? false,
      isAcidic: props.isAcidic ?? false,
      greenVeg: props.greenVeg ?? false,
      makesLunch: props.makesLunch ?? false,
      isEasyToMake: props.isEasyToMake ?? false,
      needsPrep: props.needsPrep ?? false,
    };

    // Validate mutual exclusivity
    if (qualities.isCreamy && qualities.isAcidic) {
      throw new Error('isCreamy and isAcidic cannot both be true');
    }

    return new MealQualities(qualities);
  }

  static rehydrate(props: MealQualitiesProps): MealQualities {
    // Validate on rehydration as well
    if (props.isCreamy && props.isAcidic) {
      throw new Error('isCreamy and isAcidic cannot both be true');
    }

    return new MealQualities(props);
  }

  update(updates: Partial<MealQualitiesProps>): MealQualities {
    const newProps = { ...this.props, ...updates };

    // Validate mutual exclusivity
    if (newProps.isCreamy && newProps.isAcidic) {
      throw new Error('isCreamy and isAcidic cannot both be true');
    }

    return new MealQualities(newProps);
  }

  toObject(): MealQualitiesProps {
    return { ...this.props };
  }
}

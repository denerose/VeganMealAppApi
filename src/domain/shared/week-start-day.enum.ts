export enum WeekStartDay {
  MONDAY = 'MONDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export const WEEK_START_DAY_VALUES: ReadonlyArray<WeekStartDay> = [
  WeekStartDay.MONDAY,
  WeekStartDay.SATURDAY,
  WeekStartDay.SUNDAY,
];

/** WeekStartDay to JS getDay() index (0=Sunday .. 6=Saturday) */
export const WEEK_START_DAY_INDEX: Record<WeekStartDay, number> = {
  [WeekStartDay.SUNDAY]: 0,
  [WeekStartDay.MONDAY]: 1,
  [WeekStartDay.SATURDAY]: 6,
};

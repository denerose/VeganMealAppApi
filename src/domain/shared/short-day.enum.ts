export enum ShortDay {
  MON = 'MON',
  TUE = 'TUE',
  WED = 'WED',
  THU = 'THU',
  FRI = 'FRI',
  SAT = 'SAT',
  SUN = 'SUN',
}

export const SHORT_DAY_VALUES: ReadonlyArray<ShortDay> = [
  ShortDay.MON,
  ShortDay.TUE,
  ShortDay.WED,
  ShortDay.THU,
  ShortDay.FRI,
  ShortDay.SAT,
  ShortDay.SUN,
];

/** JS getDay() index (0=Sunday .. 6=Saturday) to ShortDay */
export const DAY_INDEX_TO_SHORT_DAY: ReadonlyArray<ShortDay> = [
  ShortDay.SUN,
  ShortDay.MON,
  ShortDay.TUE,
  ShortDay.WED,
  ShortDay.THU,
  ShortDay.FRI,
  ShortDay.SAT,
];

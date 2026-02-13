export type SuccessResult<T> = {
  ok: true;
  value: T;
};

export type FailureResult<E = Error> = {
  ok: false;
  error: E;
};

export type Result<T, E = Error> = SuccessResult<T> | FailureResult<E>;

export const ok = <T>(value: T): SuccessResult<T> => ({
  ok: true,
  value,
});

export const err = <E = Error>(error: E): FailureResult<E> => ({
  ok: false,
  error,
});

export const isOk = <T, E>(result: Result<T, E>): result is SuccessResult<T> => result.ok;

export const isErr = <T, E>(result: Result<T, E>): result is FailureResult<E> => !result.ok;

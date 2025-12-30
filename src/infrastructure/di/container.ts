type Factory<T> = (container: DependencyContainer) => T;

type Registration<T> = {
  factory: Factory<T>;
  singleton: boolean;
  instance?: T;
};

export type DependencyToken<T> = symbol & { __type?: T };

export const createToken = <T>(description: string): DependencyToken<T> =>
  Symbol(description) as DependencyToken<T>;

export class DependencyContainer {
  private readonly registrations = new Map<DependencyToken<unknown>, Registration<unknown>>();

  register<T>(
    token: DependencyToken<T>,
    factory: Factory<T>,
    options: { singleton?: boolean } = {},
  ): void {
    const singleton = options.singleton ?? true;
    this.registrations.set(token, {
      factory,
      singleton,
    });
  }

  resolve<T>(token: DependencyToken<T>): T {
    const registration = this.registrations.get(token);

    if (!registration) {
      throw new Error(`No provider registered for dependency: ${token.description ?? 'unknown'}`);
    }

    if (registration.singleton) {
      if (registration.instance === undefined) {
        registration.instance = (registration.factory as Factory<T>)(this);
        this.registrations.set(token, registration);
      }

      return registration.instance as T;
    }

    return (registration.factory as Factory<T>)(this);
  }

  clear(): void {
    this.registrations.clear();
  }
}

export const container = new DependencyContainer();

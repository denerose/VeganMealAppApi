import type { DependencyContainer } from '@/infrastructure/di/container';
import type { DITokens } from '@/infrastructure/di/tokens';
import { GetUserSettingsUseCase } from '@/application/user-settings/get-user-settings.use-case';
import { UpdateUserSettingsUseCase } from '@/application/user-settings/update-user-settings.use-case';
import { UserSettingsController } from '@/infrastructure/http/controllers/user-settings.controller';

export function registerUserSettingsModule(container: DependencyContainer, TOKENS: DITokens): void {
  container.register(
    TOKENS.GetUserSettingsUseCase,
    c =>
      new GetUserSettingsUseCase(
        c.resolve(TOKENS.UserSettingsRepository),
        c.resolve(TOKENS.UserRepository)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.UpdateUserSettingsUseCase,
    c =>
      new UpdateUserSettingsUseCase(
        c.resolve(TOKENS.UserSettingsRepository),
        c.resolve(TOKENS.UserRepository)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.UserSettingsController,
    c =>
      new UserSettingsController(
        c.resolve(TOKENS.GetUserSettingsUseCase),
        c.resolve(TOKENS.UpdateUserSettingsUseCase)
      ),
    { singleton: true }
  );
}

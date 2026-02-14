import type { DependencyContainer } from '@/infrastructure/di/container';
import type { DITokens } from '@/infrastructure/di/tokens';
import { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import { JWTGenerator } from '@/infrastructure/auth/jwt/jwt-generator';
import { EmailService } from '@/infrastructure/auth/email/email.service';
import { RegisterUserUseCase } from '@/application/auth/register-user.use-case';
import { AuthenticateUserUseCase } from '@/application/auth/authenticate-user.use-case';
import { ChangePasswordUseCase } from '@/application/auth/change-password.use-case';
import { RequestPasswordResetUseCase } from '@/application/auth/request-password-reset.use-case';
import { ResetPasswordUseCase } from '@/application/auth/reset-password.use-case';
import { GetUserProfileUseCase } from '@/application/auth/get-user-profile.use-case';
import { UpdateUserProfileUseCase } from '@/application/auth/update-user-profile.use-case';
import { AuthController } from '@/infrastructure/http/controllers/auth.controller';

export function registerAuthModule(container: DependencyContainer, TOKENS: DITokens): void {
  container.register(TOKENS.BcryptPasswordHasher, () => new BcryptPasswordHasher(), {
    singleton: true,
  });
  container.register(TOKENS.JWTGenerator, () => new JWTGenerator(), { singleton: true });
  container.register(TOKENS.EmailService, () => new EmailService(), { singleton: true });

  container.register(
    TOKENS.RegisterUserUseCase,
    c =>
      new RegisterUserUseCase(
        c.resolve(TOKENS.UserRepository),
        c.resolve(TOKENS.AuthRepository),
        c.resolve(TOKENS.BcryptPasswordHasher),
        c.resolve(TOKENS.JWTGenerator)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.AuthenticateUserUseCase,
    c =>
      new AuthenticateUserUseCase(
        c.resolve(TOKENS.UserRepository),
        c.resolve(TOKENS.BcryptPasswordHasher),
        c.resolve(TOKENS.JWTGenerator)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.ChangePasswordUseCase,
    c =>
      new ChangePasswordUseCase(
        c.resolve(TOKENS.UserRepository),
        c.resolve(TOKENS.BcryptPasswordHasher)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.RequestPasswordResetUseCase,
    c =>
      new RequestPasswordResetUseCase(
        c.resolve(TOKENS.UserRepository),
        c.resolve(TOKENS.AuthRepository),
        c.resolve(TOKENS.EmailService)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.ResetPasswordUseCase,
    c =>
      new ResetPasswordUseCase(
        c.resolve(TOKENS.AuthRepository),
        c.resolve(TOKENS.UserRepository),
        c.resolve(TOKENS.BcryptPasswordHasher)
      ),
    { singleton: true }
  );
  container.register(
    TOKENS.GetUserProfileUseCase,
    c => new GetUserProfileUseCase(c.resolve(TOKENS.UserRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.UpdateUserProfileUseCase,
    c => new UpdateUserProfileUseCase(c.resolve(TOKENS.UserRepository)),
    { singleton: true }
  );
  container.register(
    TOKENS.AuthController,
    c =>
      new AuthController(
        c.resolve(TOKENS.RegisterUserUseCase),
        c.resolve(TOKENS.AuthenticateUserUseCase),
        c.resolve(TOKENS.ChangePasswordUseCase),
        c.resolve(TOKENS.RequestPasswordResetUseCase),
        c.resolve(TOKENS.ResetPasswordUseCase),
        c.resolve(TOKENS.GetUserProfileUseCase),
        c.resolve(TOKENS.UpdateUserProfileUseCase)
      ),
    { singleton: true }
  );
}

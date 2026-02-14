import { createToken } from '@/infrastructure/di/container';
import type { PrismaClient } from '@prisma/client';
import type { PlannedWeekRepository } from '@/domain/planned-week/planned-week.repository';
import type { MealRepository } from '@/domain/meal/meal.repository';
import type { IngredientRepository } from '@/domain/ingredient/ingredient.repository';
import type { UserRepository } from '@/domain/user/user.repository';
import type { UserSettingsRepository } from '@/domain/user/user-settings.repository';
import type { AuthRepository } from '@/domain/auth/auth.repository';
import type { CreatePlannedWeekUseCase } from '@/application/planned-week/create-planned-week.use-case';
import type { GetPlannedWeekUseCase } from '@/application/planned-week/get-planned-week.use-case';
import type { DeletePlannedWeekUseCase } from '@/application/planned-week/delete-planned-week.use-case';
import type { AssignMealToDayUseCase } from '@/application/planned-week/assign-meal-to-day.use-case';
import type { PopulateLeftoversUseCase } from '@/application/planned-week/populate-leftovers.use-case';
import type { ListPlannedWeeksUseCase } from '@/application/planned-week/list-planned-weeks.use-case';
import type { GetEligibleMealsUseCase } from '@/application/meal/get-eligible-meals.use-case';
import type { GetRandomMealUseCase } from '@/application/meal/get-random-meal.use-case';
import type { CreateMealUseCase } from '@/application/meal/create-meal.use-case';
import type { GetMealUseCase } from '@/application/meal/get-meal.use-case';
import type { ListMealsUseCase } from '@/application/meal/list-meals.use-case';
import type { UpdateMealUseCase } from '@/application/meal/update-meal.use-case';
import type { ArchiveMealUseCase } from '@/application/meal/archive-meal.use-case';
import type { CreateIngredientUseCase } from '@/application/ingredient/create-ingredient.use-case';
import type { GetIngredientUseCase } from '@/application/ingredient/get-ingredient.use-case';
import type { ListIngredientsUseCase } from '@/application/ingredient/list-ingredients.use-case';
import type { UpdateIngredientUseCase } from '@/application/ingredient/update-ingredient.use-case';
import type { DeleteIngredientUseCase } from '@/application/ingredient/delete-ingredient.use-case';
import type { GetUserSettingsUseCase } from '@/application/user-settings/get-user-settings.use-case';
import type { UpdateUserSettingsUseCase } from '@/application/user-settings/update-user-settings.use-case';
import type { RegisterUserUseCase } from '@/application/auth/register-user.use-case';
import type { AuthenticateUserUseCase } from '@/application/auth/authenticate-user.use-case';
import type { ChangePasswordUseCase } from '@/application/auth/change-password.use-case';
import type { RequestPasswordResetUseCase } from '@/application/auth/request-password-reset.use-case';
import type { ResetPasswordUseCase } from '@/application/auth/reset-password.use-case';
import type { GetUserProfileUseCase } from '@/application/auth/get-user-profile.use-case';
import type { UpdateUserProfileUseCase } from '@/application/auth/update-user-profile.use-case';
import type { PlannedWeekController } from '@/infrastructure/http/controllers/planned-week.controller';
import type { DayPlanController } from '@/infrastructure/http/controllers/day-plan.controller';
import type { MealController } from '@/infrastructure/http/controllers/meal.controller';
import type { IngredientController } from '@/infrastructure/http/controllers/ingredient.controller';
import type { UserSettingsController } from '@/infrastructure/http/controllers/user-settings.controller';
import type { AuthController } from '@/infrastructure/http/controllers/auth.controller';
import type { BcryptPasswordHasher } from '@/infrastructure/auth/password/bcrypt-password-hasher';
import type { JWTGenerator } from '@/infrastructure/auth/jwt/jwt-generator';
import type { EmailService } from '@/infrastructure/auth/email/email.service';

export const TOKENS = {
  PrismaClient: createToken<PrismaClient>('PrismaClient'),
  PlannedWeekRepository: createToken<PlannedWeekRepository>('PlannedWeekRepository'),
  MealRepository: createToken<MealRepository>('MealRepository'),
  IngredientRepository: createToken<IngredientRepository>('IngredientRepository'),
  UserRepository: createToken<UserRepository>('UserRepository'),
  UserSettingsRepository: createToken<UserSettingsRepository>('UserSettingsRepository'),
  AuthRepository: createToken<AuthRepository>('AuthRepository'),
  CreatePlannedWeekUseCase: createToken<CreatePlannedWeekUseCase>('CreatePlannedWeekUseCase'),
  GetPlannedWeekUseCase: createToken<GetPlannedWeekUseCase>('GetPlannedWeekUseCase'),
  ListPlannedWeeksUseCase: createToken<ListPlannedWeeksUseCase>('ListPlannedWeeksUseCase'),
  DeletePlannedWeekUseCase: createToken<DeletePlannedWeekUseCase>('DeletePlannedWeekUseCase'),
  AssignMealToDayUseCase: createToken<AssignMealToDayUseCase>('AssignMealToDayUseCase'),
  PopulateLeftoversUseCase: createToken<PopulateLeftoversUseCase>('PopulateLeftoversUseCase'),
  GetEligibleMealsUseCase: createToken<GetEligibleMealsUseCase>('GetEligibleMealsUseCase'),
  GetRandomMealUseCase: createToken<GetRandomMealUseCase>('GetRandomMealUseCase'),
  CreateMealUseCase: createToken<CreateMealUseCase>('CreateMealUseCase'),
  GetMealUseCase: createToken<GetMealUseCase>('GetMealUseCase'),
  ListMealsUseCase: createToken<ListMealsUseCase>('ListMealsUseCase'),
  UpdateMealUseCase: createToken<UpdateMealUseCase>('UpdateMealUseCase'),
  ArchiveMealUseCase: createToken<ArchiveMealUseCase>('ArchiveMealUseCase'),
  CreateIngredientUseCase: createToken<CreateIngredientUseCase>('CreateIngredientUseCase'),
  GetIngredientUseCase: createToken<GetIngredientUseCase>('GetIngredientUseCase'),
  ListIngredientsUseCase: createToken<ListIngredientsUseCase>('ListIngredientsUseCase'),
  UpdateIngredientUseCase: createToken<UpdateIngredientUseCase>('UpdateIngredientUseCase'),
  DeleteIngredientUseCase: createToken<DeleteIngredientUseCase>('DeleteIngredientUseCase'),
  GetUserSettingsUseCase: createToken<GetUserSettingsUseCase>('GetUserSettingsUseCase'),
  UpdateUserSettingsUseCase: createToken<UpdateUserSettingsUseCase>('UpdateUserSettingsUseCase'),
  RegisterUserUseCase: createToken<RegisterUserUseCase>('RegisterUserUseCase'),
  AuthenticateUserUseCase: createToken<AuthenticateUserUseCase>('AuthenticateUserUseCase'),
  ChangePasswordUseCase: createToken<ChangePasswordUseCase>('ChangePasswordUseCase'),
  RequestPasswordResetUseCase: createToken<RequestPasswordResetUseCase>(
    'RequestPasswordResetUseCase'
  ),
  ResetPasswordUseCase: createToken<ResetPasswordUseCase>('ResetPasswordUseCase'),
  GetUserProfileUseCase: createToken<GetUserProfileUseCase>('GetUserProfileUseCase'),
  UpdateUserProfileUseCase: createToken<UpdateUserProfileUseCase>('UpdateUserProfileUseCase'),
  BcryptPasswordHasher: createToken<BcryptPasswordHasher>('BcryptPasswordHasher'),
  JWTGenerator: createToken<JWTGenerator>('JWTGenerator'),
  EmailService: createToken<EmailService>('EmailService'),
  PlannedWeekController: createToken<PlannedWeekController>('PlannedWeekController'),
  DayPlanController: createToken<DayPlanController>('DayPlanController'),
  MealController: createToken<MealController>('MealController'),
  IngredientController: createToken<IngredientController>('IngredientController'),
  UserSettingsController: createToken<UserSettingsController>('UserSettingsController'),
  AuthController: createToken<AuthController>('AuthController'),
};

export type DITokens = typeof TOKENS;

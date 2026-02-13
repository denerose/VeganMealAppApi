import type { GetUserSettingsUseCase } from '@/application/use-cases/get-user-settings.use-case';
import type {
  UpdateUserSettingsParams,
  UpdateUserSettingsUseCase,
} from '@/application/use-cases/update-user-settings.use-case';
import type { UpdateUserSettingsDto } from '../dtos/user-settings.dto';
import { toUserSettingsDto } from '../dtos/user-settings.dto';
import { validateUpdateUserSettingsDto } from '../validators/user-settings.validator';
import { createErrorBody } from '../dtos/common.dto';
import type { RouteContext } from '../routes';

export class UserSettingsController {
  constructor(
    private getUserSettingsUseCase: GetUserSettingsUseCase,
    private updateUserSettingsUseCase: UpdateUserSettingsUseCase
  ) {}

  async getUserSettings(context: RouteContext): Promise<Response> {
    try {
      // TODO: Extract userId and tenantId from authentication context
      // For now, placeholder auth check
      const userId: string = context.params.userId ?? 'mock-user-id';
      const tenantId: string = context.params.tenantId ?? 'mock-tenant-id';

      if (!userId || !tenantId) {
        return new Response(JSON.stringify(createErrorBody('Unauthorized')), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const settings = await this.getUserSettingsUseCase.execute(userId, tenantId);
      const dto = toUserSettingsDto(settings);

      return new Response(JSON.stringify(dto), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error getting user settings:', error);

      if (error instanceof Error) {
        if (error.message === 'User not found') {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  async updateUserSettings(context: RouteContext): Promise<Response> {
    try {
      // TODO: Extract userId and tenantId from authentication context
      const userId = context.params.userId || 'mock-user-id';
      const tenantId = context.params.tenantId || 'mock-tenant-id';

      if (!userId || !tenantId) {
        return new Response(JSON.stringify(createErrorBody('Unauthorized')), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Validate request body
      const body = (await context.request.json()) as unknown;
      const updateParams = validateUpdateUserSettingsDto(body) as UpdateUserSettingsDto;

      const settings = await this.updateUserSettingsUseCase.execute(
        userId,
        tenantId,
        updateParams as UpdateUserSettingsParams
      );

      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- toUserSettingsDto returns UserSettingsDto */
      const dto = toUserSettingsDto(settings);

      return new Response(JSON.stringify(dto), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (error) {
      console.error('Error updating user settings:', error);

      if (error instanceof Error) {
        if (error.message === 'Only tenant administrators can update user settings') {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          });
        }

        // Validation errors
        if (
          error.message.includes('must be') ||
          error.message.includes('Invalid') ||
          error.message.includes('Missing') ||
          error.message.includes('Duplicate') ||
          error.message.includes('At least one field')
        ) {
          return new Response(JSON.stringify(createErrorBody(error.message)), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify(createErrorBody('Internal server error')), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
}

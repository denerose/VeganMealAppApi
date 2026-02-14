import type { GetUserSettingsUseCase } from '@/application/user-settings/get-user-settings.use-case';
import type { UpdateUserSettingsUseCase } from '@/application/user-settings/update-user-settings.use-case';
import { toUserSettingsDto } from '../dtos/user-settings.dto';
import { validateUpdateUserSettingsDto } from '../validators/user-settings.validator';
import { createErrorBody, errorMessage } from '../dtos/common.dto';
import { jsonResponse } from '../response.utils';
import type { RouteContext } from '../routes';

export class UserSettingsController {
  constructor(
    private readonly getUserSettingsUseCase: GetUserSettingsUseCase,
    private readonly updateUserSettingsUseCase: UpdateUserSettingsUseCase
  ) {}

  async getUserSettings(context: RouteContext): Promise<Response> {
    try {
      const userId = context.userId;
      const tenantId = context.tenantId;

      if (!userId || !tenantId) {
        return jsonResponse(createErrorBody('Unauthorized'), 401);
      }

      const settings = await this.getUserSettingsUseCase.execute(userId, tenantId);
      const dto = toUserSettingsDto(settings);

      return jsonResponse(dto);
    } catch (error) {
      console.error('Error getting user settings:', error);

      if (errorMessage(error) === 'User not found') {
        return jsonResponse(createErrorBody(errorMessage(error)), 404);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }

  async updateUserSettings(context: RouteContext): Promise<Response> {
    try {
      const userId = context.userId;
      const tenantId = context.tenantId;

      if (!userId || !tenantId) {
        return jsonResponse(createErrorBody('Unauthorized'), 401);
      }

      // Validate request body
      const body = (await context.request.json()) as unknown;
      const updateParams = validateUpdateUserSettingsDto(body);

      const settings = await this.updateUserSettingsUseCase.execute(userId, tenantId, updateParams);

      /* eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- toUserSettingsDto returns UserSettingsDto */
      const dto = toUserSettingsDto(settings);

      return jsonResponse(dto);
    } catch (error) {
      console.error('Error updating user settings:', error);

      const msg = errorMessage(error);
      if (msg === 'Only tenant administrators can update user settings') {
        return jsonResponse(createErrorBody(msg), 403);
      }
      if (
        msg.includes('must be') ||
        msg.includes('Invalid') ||
        msg.includes('Missing') ||
        msg.includes('Duplicate') ||
        msg.includes('At least one field')
      ) {
        return jsonResponse(createErrorBody(msg), 400);
      }

      return jsonResponse(createErrorBody('Internal server error'), 500);
    }
  }
}

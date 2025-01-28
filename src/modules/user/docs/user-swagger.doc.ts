import { applyDecorators } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { UpdateUserDto } from '@user/dto/update-user-dto';

export function SoftDeleteUserDocs() {
  return applyDecorators(
    ApiTags('Users'),
    ApiBearerAuth(),
    ApiOperation({ summary: 'Soft delete a user account' }),
    ApiResponse({ status: 204, description: 'Deletion in progress' }),
    ApiResponse({ status: 400, description: 'Bad Request' }),
    ApiResponse({ status: 401, description: 'Unauthorized' }),
    ApiResponse({ status: 500, description: 'Internal Server Error' })
  );
}

export function UpdateUserDocs() {
  return applyDecorators(
    ApiTags('Users'),
    ApiOperation({ summary: 'Update User' }),
    ApiResponse({
      status: 200,
      description: 'User updated successfully',
      type: UpdateUserDto,
    })
  );
}

import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { Role } from '../enums/role.enum';

type ApiParamDoc = {
  name: string;
  description: string;
  type?: 'number' | 'string';
};

type ApiRouteOptions = {
  summary: string;
  description?: string;
  roles?: Role[];
  params?: ApiParamDoc[];
  bodyType?: Type<unknown>;
  bodyTypes?: Type<unknown>[];
  bodySchema?: Record<string, unknown>;
  bodyDescription?: string;
  status?: number;
  responseDescription?: string;
  responseExample?: unknown;
  wrappedResponse?: boolean;
  notFound?: boolean;
  badRequest?: boolean;
};

function successSchema(example: unknown, wrapped: boolean) {
  if (wrapped) {
    return {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: { example },
      },
    };
  }

  return { example };
}

function roleDescription(roles: Role[]) {
  return 'Required role header. Accepted values: ' + roles.join(', ');
}

export function ApiRoute(options: ApiRouteOptions) {
  const decorators: MethodDecorator[] = [
    ApiOperation({
      summary: options.summary,
      description: options.description,
    }),
    ApiResponse({
      status: options.status || 200,
      description: options.responseDescription || 'Successful response',
      schema: successSchema(options.responseExample ?? {}, !!options.wrappedResponse),
    }),
  ];

  if (options.roles && options.roles.length) {
    decorators.push(
      ApiHeader({
        name: 'role',
        required: true,
        description: roleDescription(options.roles),
        schema: { enum: options.roles },
      }),
      ApiForbiddenResponse({
        description: 'Role header is missing or the supplied role is not allowed for this endpoint.',
      }),
    );
  }

  if (options.params) {
    options.params.forEach((param) => {
      decorators.push(
        ApiParam({
          name: param.name,
          description: param.description,
          type: param.type || 'number',
        }),
      );
    });
  }

  if (options.bodyType) {
    decorators.push(
      ApiBody({
        description: options.bodyDescription || 'Request body',
        type: options.bodyType,
      }),
    );
  }

  if (options.bodyTypes && options.bodyTypes.length) {
    decorators.push(
      ApiBody({
        description: options.bodyDescription || 'Request body',
        schema: {
          oneOf: options.bodyTypes.map((bodyType) => ({
            $ref: getSchemaPath(bodyType),
          })),
        },
      }),
    );
  }

  if (options.bodySchema) {
    decorators.push(
      ApiBody({
        description: options.bodyDescription || 'Request body',
        schema: options.bodySchema,
      }),
    );
  }

  if (options.badRequest !== false) {
    decorators.push(
      ApiBadRequestResponse({
        description:
          'Invalid request body, route parameter, or business-rule validation failure.',
      }),
    );
  }

  if (options.notFound !== false) {
    decorators.push(
      ApiNotFoundResponse({
        description: 'The requested resource was not found.',
      }),
    );
  }

  return applyDecorators(...decorators);
}

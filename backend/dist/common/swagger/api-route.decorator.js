"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiRoute = ApiRoute;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
function successSchema(example, wrapped) {
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
function roleDescription(roles) {
    return 'Required role header. Accepted values: ' + roles.join(', ');
}
function ApiRoute(options) {
    const decorators = [
        (0, swagger_1.ApiOperation)({
            summary: options.summary,
            description: options.description,
        }),
        (0, swagger_1.ApiResponse)({
            status: options.status || 200,
            description: options.responseDescription || 'Successful response',
            schema: successSchema(options.responseExample ?? {}, !!options.wrappedResponse),
        }),
    ];
    if (options.roles && options.roles.length) {
        decorators.push((0, swagger_1.ApiHeader)({
            name: 'role',
            required: true,
            description: roleDescription(options.roles),
            schema: { enum: options.roles },
        }), (0, swagger_1.ApiForbiddenResponse)({
            description: 'Role header is missing or the supplied role is not allowed for this endpoint.',
        }));
    }
    if (options.params) {
        options.params.forEach((param) => {
            decorators.push((0, swagger_1.ApiParam)({
                name: param.name,
                description: param.description,
                type: param.type || 'number',
            }));
        });
    }
    if (options.bodyType) {
        decorators.push((0, swagger_1.ApiBody)({
            description: options.bodyDescription || 'Request body',
            type: options.bodyType,
        }));
    }
    if (options.bodyTypes && options.bodyTypes.length) {
        decorators.push((0, swagger_1.ApiBody)({
            description: options.bodyDescription || 'Request body',
            schema: {
                oneOf: options.bodyTypes.map((bodyType) => ({
                    $ref: (0, swagger_1.getSchemaPath)(bodyType),
                })),
            },
        }));
    }
    if (options.bodySchema) {
        decorators.push((0, swagger_1.ApiBody)({
            description: options.bodyDescription || 'Request body',
            schema: options.bodySchema,
        }));
    }
    if (options.badRequest !== false) {
        decorators.push((0, swagger_1.ApiBadRequestResponse)({
            description: 'Invalid request body, route parameter, or business-rule validation failure.',
        }));
    }
    if (options.notFound !== false) {
        decorators.push((0, swagger_1.ApiNotFoundResponse)({
            description: 'The requested resource was not found.',
        }));
    }
    return (0, common_1.applyDecorators)(...decorators);
}
//# sourceMappingURL=api-route.decorator.js.map
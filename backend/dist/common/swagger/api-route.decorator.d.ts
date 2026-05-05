import { Type } from '@nestjs/common';
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
export declare function ApiRoute(options: ApiRouteOptions): <TFunction extends Function, Y>(target: TFunction | object, propertyKey?: string | symbol, descriptor?: TypedPropertyDescriptor<Y>) => void;
export {};

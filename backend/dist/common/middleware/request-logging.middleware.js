"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequestLoggingMiddleware = void 0;
const node_crypto_1 = require("node:crypto");
const common_1 = require("@nestjs/common");
const log_manager_1 = require("../logging/log-manager");
let RequestLoggingMiddleware = class RequestLoggingMiddleware {
    logger = new log_manager_1.LogManager();
    use(request, response, next) {
        const requestWithId = request;
        requestWithId.requestId = (0, node_crypto_1.randomUUID)();
        response.setHeader('X-Request-Id', requestWithId.requestId);
        const startTime = Date.now();
        response.once('finish', () => {
            const level = response.statusCode >= 500 ? 'ERROR' : response.statusCode >= 400 ? 'WARN' : 'INFO';
            this.logger.write('application.log', {
                level,
                event: 'request_completed',
                requestId: requestWithId.requestId,
                method: request.method,
                path: request.originalUrl,
                statusCode: response.statusCode,
                responseTimeMs: Date.now() - startTime,
            });
        });
        next();
    }
};
exports.RequestLoggingMiddleware = RequestLoggingMiddleware;
exports.RequestLoggingMiddleware = RequestLoggingMiddleware = __decorate([
    (0, common_1.Injectable)()
], RequestLoggingMiddleware);
//# sourceMappingURL=request-logging.middleware.js.map
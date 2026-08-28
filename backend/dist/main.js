"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const helmet_1 = __importDefault(require("helmet"));
const app_module_1 = require("./app.module");
const request_logging_middleware_1 = require("./common/middleware/request-logging.middleware");
const global_exception_filter_1 = require("./common/filters/global-exception.filter");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const requestLoggingMiddleware = new request_logging_middleware_1.RequestLoggingMiddleware();
    app.use(requestLoggingMiddleware.use.bind(requestLoggingMiddleware));
    app.useGlobalFilters(new global_exception_filter_1.GlobalExceptionFilter());
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                'script-src': ["'self'", "'unsafe-inline'"],
                'style-src': ["'self'", "'unsafe-inline'"],
                'img-src': ["'self'", 'data:'],
            },
        },
    }));
    const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
    app.enableCors({
        origin: (requestOrigin, callback) => {
            if (!requestOrigin || requestOrigin === 'null' || corsOrigins.includes(requestOrigin)) {
                callback(null, true);
                return;
            }
            callback(null, false);
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'role'],
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const config = new swagger_1.DocumentBuilder()
        .setTitle('TradeZo API')
        .setDescription('Backend API documentation for TradeZo. Protected endpoints require a role header matching one of the documented role values.')
        .setVersion('1.0')
        .build();
    const documentFactory = () => swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, documentFactory);
    swagger_1.SwaggerModule.setup('swagger', app, documentFactory);
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
    console.error('Failed to start application:', err);
});
//# sourceMappingURL=main.js.map
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { RequestLoggingMiddleware } from './common/middleware/request-logging.middleware';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const requestLoggingMiddleware = new RequestLoggingMiddleware();
  app.use(requestLoggingMiddleware.use.bind(requestLoggingMiddleware));
  app.useGlobalFilters(new GlobalExceptionFilter());

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          // Swagger UI uses inline configuration and styles. Keep those narrowly
          // permitted while retaining Helmet's remaining default CSP directives.
          'script-src': ["'self'", "'unsafe-inline'"],
          'style-src': ["'self'", "'unsafe-inline'"],
          'img-src': ["'self'", 'data:'],
        },
      },
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !requestOrigin ||
        requestOrigin === 'null' ||
        /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(requestOrigin) ||
        corsOrigins.includes(requestOrigin)
      ) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'role'],
  });
  app.setGlobalPrefix('api');

  // Use global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle('TradeZo API')
    .setDescription(
      'Backend API documentation for TradeZo. Protected endpoints require a role header matching one of the documented role values.',
    )
    .setVersion('1.0')
    .build();
  const documentFactory = () => SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, documentFactory);
  SwaggerModule.setup('swagger', app, documentFactory);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
});

import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';

@Global()
@Module({
  imports: [
    UsersModule,
    AuditLogsModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET')?.trim();
        if (!secret) {
          throw new Error('JWT_SECRET must be configured');
        }

        const configuredExpiration = Number(
          configService.get<string>('JWT_EXPIRES_IN_SECONDS'),
        );
        return {
          secret,
          signOptions: {
            expiresIn:
              Number.isSafeInteger(configuredExpiration) && configuredExpiration > 0
                ? configuredExpiration
                : 8 * 60 * 60,
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}

// src/auth/auth.module.ts
import { Module }         from '@nestjs/common';
import { JwtModule }      from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthController }    from './auth.controller';
import { AuthService }       from './auth.service';
import { AuthenticaService } from './authentica.service';
import { JwtStrategy }       from './strategies/jwt.strategy';
import { JwtAuthGuard }      from './guards/jwt-auth.guard';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports:    [ConfigModule],
      inject:     [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret:      config.getOrThrow<string>('JWT_SECRET'),
        signOptions: {
          // Access Token expires in 15 minutes for better security
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers:   [AuthService, AuthenticaService, JwtStrategy, JwtAuthGuard],
  exports:     [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
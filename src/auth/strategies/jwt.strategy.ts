// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest:   ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:      config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  // payload يُصبح متاحاً كـ req.user في الـ controllers
  async validate(payload: { sub: number; phone: string; name: string }) {
    if (!payload?.sub) throw new UnauthorizedException();
    return { sub: payload.sub, phone: payload.phone, name: payload.name };
  }
}
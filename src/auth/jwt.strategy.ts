import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { User } from '../models/user.model';

interface JwtPayload {
  sub: string;
  email: string;
  role?: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectModel(User) private userModel: typeof User,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'defaultSecret', // Fallback for dev
    });
  }

  async validate(payload: JwtPayload) {
    // If role is in token, use it
    if (payload.role) {
      return { userId: payload.sub, email: payload.email, role: payload.role };
    }

    // Fallback: fetch user from database to get role
    console.log('[JWT Strategy] Role missing from token, fetching from DB for user:', payload.sub);
    const user = await this.userModel.findByPk(payload.sub);
    if (!user) {
      console.log('[JWT Strategy] User not found in DB:', payload.sub);
      return { userId: payload.sub, email: payload.email, role: null };
    }

    console.log('[JWT Strategy] User found in DB with role:', user.role);
    return { userId: payload.sub, email: payload.email, role: user.role };
  }
}

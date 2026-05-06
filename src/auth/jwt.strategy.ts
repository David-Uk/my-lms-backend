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
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      console.warn(
        '[JWT Strategy] JWT_SECRET is not defined in environment! Using fallback.',
      );
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'supersecretkey123',
    });
  }

  async validate(payload: JwtPayload) {
    // If role is in token, use it
    if (payload.role) {
      return { userId: payload.sub, email: payload.email, role: payload.role };
    }

    // Fallback: fetch user from database to get role
    console.log(
      '[JWT Strategy] Role missing from token, fetching from DB for user:',
      payload.sub,
    );
    const user = await this.userModel.findByPk(payload.sub);
    if (!user) {
      console.log('[JWT Strategy] User not found in DB:', payload.sub);
      return null; // This will trigger a 401
    }

    console.log('[JWT Strategy] User validated:', {
      id: user.get('id'),
      email: user.get('email'),
      role: user.get('role'),
    });
    return {
      userId: payload.sub,
      email: user.get('email'),
      role: user.get('role'),
    };
  }
}

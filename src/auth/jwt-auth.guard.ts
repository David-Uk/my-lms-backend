import { Injectable, UnauthorizedException, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info, context: ExecutionContext) {
    if (err || !user) {
      console.error('[JwtAuthGuard] Authentication failed:', {
        error: err,
        info: info?.message,
        user: !!user,
        url: context.switchToHttp().getRequest().url,
        authHeader: context.switchToHttp().getRequest().headers.authorization ? 'Present' : 'Missing',
      });
      throw err || new UnauthorizedException();
    }
    return user;
  }
}

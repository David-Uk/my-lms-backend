import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../models/user.model';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<UserRole[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{
      user: { role: UserRole };
    }>();
    const user = request.user;
    const hasRole = user && user.role && requiredRoles.includes(user.role);
    
    if (!hasRole) {
      console.error('[RolesGuard] Access denied:', {
        userRole: user?.role,
        requiredRoles,
        userId: user?.['userId'],
      });
      throw new ForbiddenException(
        'You do not have permission to access this resource',
      );
    }
    return true;
  }
}

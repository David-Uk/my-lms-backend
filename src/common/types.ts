import { Request } from 'express';
import { UserRole } from '../models';

export interface AuthenticatedRequest extends Request {
  user: {
    userId: string;
    role: UserRole;
  };
}

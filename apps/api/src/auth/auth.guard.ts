import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jwt from 'jsonwebtoken';
import { Request } from 'express';

export interface AuthenticatedUser {
  supabaseUid: string;
  gymId: string;
  role: string;
  email: string;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing authorization token');
    }

    const secret = this.configService.get<string>('SUPABASE_JWT_SECRET');
    if (!secret) {
      throw new UnauthorizedException('JWT secret not configured');
    }

    try {
      const payload = jwt.verify(token, secret) as jwt.JwtPayload;

      const user: AuthenticatedUser = {
        supabaseUid: payload.sub as string,
        gymId: payload.gym_id as string,
        role: payload.role as string,
        email: payload.email as string,
      };

      (request as any).user = user;
      return true;
    } catch (err) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private extractToken(request: Request): string | null {
    const authHeader = request.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

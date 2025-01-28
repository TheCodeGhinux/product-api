import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import appConfig from '../../config/auth.config';
import { IS_PUBLIC_KEY } from '../helpers/skipAuth';
import * as SYS_MSG from '../constant/SystemMessages';
import { CustomHttpException } from '../helpers/custom-http-filter';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromRequest(request);

    const isPublicRoute = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublicRoute) {
      return true;
    }

    if (!token) {
      throw new CustomHttpException(SYS_MSG.UNAUTHENTICATED_MESSAGE, HttpStatus.UNAUTHORIZED);
    }

    const payload = await this.jwtService
      .verifyAsync(await token, {
        secret: appConfig().jwtSecret,
      })
      .catch(err => null);

    if (!payload) throw new CustomHttpException(SYS_MSG.UNAUTHENTICATED_MESSAGE, HttpStatus.UNAUTHORIZED);

    if (this.isExpiredToken(payload)) {
      throw new CustomHttpException(SYS_MSG.UNAUTHENTICATED_MESSAGE, HttpStatus.UNAUTHORIZED);
    }
    request['user'] = payload;
    request['token'] = token;

    return true;
  }

  // Extract token from Authorization header or cookie
  private async extractTokenFromRequest(request: Request): Promise<string | undefined> {
    const authHeaderToken = this.extractTokenFromHeader(request);

    if (authHeaderToken) {
      try {
        // Verify if the token is valid
        await this.jwtService.verifyAsync(authHeaderToken, {
          secret: appConfig().jwtSecret,
        });
        return authHeaderToken;
      } catch (error) {
        // Token is invalid or expired, silently continue to check cookies
      }
    }

    // Check cookies for access_token
    const cookieToken = request.cookies?.access_token;
    if (cookieToken) {
      try {
        // Verify if the cookie token is valid
        await this.jwtService.verifyAsync(cookieToken, {
          secret: appConfig().jwtSecret,
        });
        console.log('Valid token from cookies:', cookieToken);
        return cookieToken;
      } catch (error) {
        // Token is invalid or expired, silently continue
      }
    }

    console.log('No valid token found in Authorization header or cookies');
    return undefined;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private isExpiredToken(token: any) {
    const currentTime = Math.floor(Date.now() / 1000);
    if (token.exp < currentTime) {
      return true;
    }

    return false;
  }
}

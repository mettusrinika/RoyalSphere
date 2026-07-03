import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  use(
    req: Request,
    res: Response,
    next: NextFunction,
  ) {
    // Remove Express header
    res.removeHeader('X-Powered-By');

    // Prevent MIME sniffing
    res.setHeader(
      'X-Content-Type-Options',
      'nosniff',
    );

    // Clickjacking protection
    res.setHeader(
      'X-Frame-Options',
      'DENY',
    );

    // XSS protection (legacy browsers)
    res.setHeader(
      'X-XSS-Protection',
      '1; mode=block',
    );

    next();
  }
}
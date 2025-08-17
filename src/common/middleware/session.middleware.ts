import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class SessionMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    
    if (authHeader) {
      try {
        const [scheme, token] = authHeader.split(' ');
        
        if (scheme?.toLowerCase() === 'bearer' && token) {
          const decoded = await this.authService.validateSessionToken(token);
          req.user = decoded;
          
          // Log session activity
          console.log(`🔐 Session validated for user: ${decoded.userName}`);
        }
      } catch (error) {
        // Don't throw error here, just log it
        console.log(`⚠️ Session validation failed: ${error.message}`);
      }
    }
    
    next();
  }
}

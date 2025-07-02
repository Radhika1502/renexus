import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import * as rateLimit from 'express-rate-limit';
import * as xss from 'xss-clean';
import * as hpp from 'hpp';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private helmet = helmet();
  private rateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
  });
  private xssClean = xss();
  private hpp = hpp();

  use(req: Request, res: Response, next: NextFunction) {
    // Apply security headers with Helmet
    this.helmet(req, res, () => {
      // Apply rate limiting
      this.rateLimiter(req, res, () => {
        // Prevent XSS attacks
        this.xssClean(req, res, () => {
          // Prevent HTTP Parameter Pollution
          this.hpp(req, res, () => {
            // Add additional security headers
            res.setHeader('X-Content-Type-Options', 'nosniff');
            res.setHeader('X-Frame-Options', 'SAMEORIGIN');
            res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
            
            // Continue to next middleware
            next();
          });
        });
      });
    });
  }
}

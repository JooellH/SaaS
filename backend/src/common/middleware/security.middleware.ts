import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogsService } from '../../logs/logs.service';

@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  constructor(private logsService: LogsService) {}

  use(req: Request, res: Response, next: NextFunction) {
    // Log suspicious activity
    const suspiciousPatterns = [
      /(\.\.|\/etc\/|\/proc\/)/i, // Path traversal
      /(union|select|insert|update|delete|drop|create|alter)/i, // SQL injection
      /(<script|javascript:|onerror=|onclick=)/i, // XSS
    ];

    const urlPath = req.path;
    const isSuspicious = suspiciousPatterns.some((pattern) =>
      pattern.test(urlPath),
    );

    if (isSuspicious) {
      this.logsService.createSecurityLog({
        ip: req.ip || req.socket.remoteAddress || 'unknown',
        endpoint: urlPath,
        details: {
          method: req.method,
          headers: req.headers,
          body: req.body,
        },
      });
    }

    next();
  }
}

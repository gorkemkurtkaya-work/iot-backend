import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { UserLogsService } from './user-logs.service';

// Request tipini genişletmek için interface
interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    company_id?: string;
  };
}

@Injectable()
export class UserLogsMiddleware implements NestMiddleware {
  constructor(private readonly userLogsService: UserLogsService) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    // Sadece belirli rotalar için log oluştur
    if (this.shouldLogRequest(req)) {
      try {
        // Kullanıcı kimliğini JWT token'dan al
        if (req.user && req.user.id) {
          // Kullanıcının eylemini belirle
          const action = this.determineAction(req);
          
          // Log oluştur
          await this.userLogsService.create({
            user_id: req.user.id,
            action: action,
          });
        }
      } catch (error) {
        // Log oluşturma hatası olsa bile devam et (uygulamayı etkilemesin)
        console.error('Kullanıcı log oluşturma hatası:', error);
      }
    }
    
    next();
  }

  private shouldLogRequest(req: Request): boolean {
    // Aşağıdaki şartları sağlayan istekler için log oluştur
    // 1. GET isteği olmalı
    // 2. Logs ile ilgili bir endpoint olmalı
    
    return (
      req.method === 'GET' &&
      (req.path === '/logs' || req.path.startsWith('/logs/') ||
       req.path === '/sensor-data' || req.path.startsWith('/sensor-data/') ||
       req.path === '/user-logs' || req.path.startsWith('/user-logs/'))
    );
  }

  private determineAction(req: Request): string {
    // İstek yoluna göre eylemi belirle
    if (req.path === '/logs' || req.path.startsWith('/logs/')) {
      return 'viewed_logs';
    } else if (req.path === '/sensor-data' || req.path.startsWith('/sensor-data/')) {
      return 'viewed_sensor_data';
    } else if (req.path === '/user-logs' || req.path.startsWith('/user-logs/')) {
      return 'viewed_user_logs';
    }
    
    return 'unknown_action';
  }
} 
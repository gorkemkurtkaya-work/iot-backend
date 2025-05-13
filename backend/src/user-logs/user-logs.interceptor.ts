import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UserLogsService } from './user-logs.service';

@Injectable()
export class UserLogsInterceptor implements NestInterceptor {
  constructor(private readonly userLogsService: UserLogsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        const request = context.switchToHttp().getRequest();
        
        // Sadece log ilgili sayfaları ziyaret eden kullanıcıları logla
        if (this.shouldLogRequest(request) && request.user) {
          // Ziyaret kaydı oluştur
          this.userLogsService.create({
            user_id: request.user.id,
            action: this.determineAction(request),
          })
          .catch(err => console.error('Kullanıcı log oluşturma hatası:', err));
        }
      }),
    );
  }

  private shouldLogRequest(request): boolean {
    return (
      request.method === 'GET' &&
      (request.path === '/logs' || request.path.startsWith('/logs/') || 
       request.path === '/sensor-data' || request.path.startsWith('/sensor-data/') ||
       request.path === '/user-logs' || request.path.startsWith('/user-logs/'))
    );
  }

  private determineAction(request): string {
    if (request.path === '/logs' || request.path.startsWith('/logs/')) {
      return 'viewed_logs';
    } else if (request.path === '/sensor-data' || request.path.startsWith('/sensor-data/')) {
      return 'viewed_sensor_data';
    } else if (request.path === '/user-logs' || request.path.startsWith('/user-logs/')) {
      return 'viewed_user_logs';
    }
    
    return 'unknown_action';
  }
} 
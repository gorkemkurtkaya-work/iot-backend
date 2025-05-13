import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { UserLogsService } from './user-logs.service';
import { UserLogsController } from './user-logs.controller';
import { UserLogsMiddleware } from './user-logs.middleware';

@Module({
  controllers: [UserLogsController],
  providers: [UserLogsService],
  exports: [UserLogsService],
})
export class UserLogsModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(UserLogsMiddleware)
      .forRoutes(
        { path: 'logs/*wildcard', method: RequestMethod.GET },
        { path: 'logs', method: RequestMethod.GET },
        { path: 'sensor-data/*wildcard', method: RequestMethod.GET },
        { path: 'sensor-data', method: RequestMethod.GET },
        { path: 'user-logs/*wildcard', method: RequestMethod.GET },
        { path: 'user-logs', method: RequestMethod.GET }
      );
  }
} 
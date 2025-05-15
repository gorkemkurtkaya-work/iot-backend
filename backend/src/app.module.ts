import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { DevicesModule } from './devices/devices.module';
import { SensorDataModule } from './sensor-data/sensor-data.module';
import { MqttModule } from './mqtt/mqtt.module';
import { DeviceAssignmentsModule } from './device_assignments/device-assignments.module';
import { UserLogsModule } from './user-logs/user-logs.module';
import { UserLogsInterceptor } from './user-logs/user-logs.interceptor';
import { WebsocketModule } from './websocket/websocket.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CompaniesModule,
    DevicesModule,
    SensorDataModule,
    MqttModule,
    DeviceAssignmentsModule,
    UserLogsModule,
    WebsocketModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: UserLogsInterceptor,
    }
  ],
})
export class AppModule {}

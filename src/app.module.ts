import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';
import { DevicesModule } from './devices/devices.module';
import { SensorDataModule } from './sensor-data/sensor-data.module';
import { MqttModule } from './mqtt/mqtt.module';
import { DeviceAssignmentsModule } from './device_assignments/device-assignments.module';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    CompaniesModule,
    DevicesModule,
    SensorDataModule,
    MqttModule,
    DeviceAssignmentsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

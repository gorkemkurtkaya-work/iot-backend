import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorDataModule } from '../sensor-data/sensor-data.module';

@Module({
  imports: [SensorDataModule],
  providers: [MqttService],
})
export class MqttModule {}

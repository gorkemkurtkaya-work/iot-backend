import { Module } from '@nestjs/common';
import { MqttService } from './mqtt.service';
import { SensorDataModule } from '../sensor-data/sensor-data.module';
import { WebsocketModule } from '../websocket/websocket.module';

@Module({
  imports: [SensorDataModule, WebsocketModule],
  providers: [MqttService],
  exports: [MqttService],
})
export class MqttModule {}

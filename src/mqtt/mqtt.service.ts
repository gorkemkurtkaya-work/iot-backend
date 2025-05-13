import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { SensorDataService } from '../sensor-data/sensor-data.service';

@Injectable()
export class MqttService implements OnModuleInit {
  private client;

  constructor(private readonly sensorDataService: SensorDataService) {}

  onModuleInit() {
    this.connectAndSubscribe();
  }

  private connectAndSubscribe() {
    this.client = mqtt.connect('mqtt://localhost:1883'); // veya ortam değişkeni

    this.client.on('connect', () => {
      console.log('✅ MQTT bağlantısı kuruldu');
      this.client.subscribe('factory/temperature/#', (err) => {
        if (err) console.error('📛 MQTT subscribe hatası:', err);
        else console.log('📡 MQTT topic’e abone olundu');
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());

        // Basit doğrulama
        const { sensor_id, temperature, humidity, timestamp } = payload;
        if (!sensor_id || !temperature || !humidity || !timestamp) {
          console.warn('📛 Eksik veri:', payload);
          return;
        }

        // Veritabanına kaydet
        await this.sensorDataService.create({
          sensor_id,
          temperature,
          humidity,
          timestamp, // ISO string olmalı
        });

        console.log('✅ Veri kaydedildi:', payload);
      } catch (err) {
        console.error('📛 MQTT mesaj işleme hatası:', err.message);
      }
    });
  }
}

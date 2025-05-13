import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { SensorDataService } from '../sensor-data/sensor-data.service';
import { logger } from '../config/logger';

@Injectable()
export class MqttService implements OnModuleInit {
  private client;

  constructor(private readonly sensorDataService: SensorDataService) {}

  onModuleInit() {
    this.connectAndSubscribe();
  }

  private connectAndSubscribe() {
    this.client = mqtt.connect('mqtt://localhost:1883');

    this.client.on('connect', () => {
      logger.info('MQTT bağlantısı kuruldu');
      this.client.subscribe('factory/temperature/#', (err) => {
        if (err) {
          logger.error('MQTT subscribe hatası', { error: err.message });
        } else {
          logger.info('MQTT topic\'e abone olundu', { topic: 'factory/temperature/#' });
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        logger.debug('MQTT mesajı alındı', { topic, payload });

        // Basit doğrulama
        const { sensor_id, temperature, humidity, timestamp } = payload;
        if (!sensor_id || !temperature || !humidity || !timestamp) {
          logger.warn('Eksik veri alındı', { payload });
          return;
        }

        // Veritabanına kaydet
        await this.sensorDataService.create({
          sensor_id,
          temperature,
          humidity,
          timestamp,
        });

        logger.info('Sensör verisi kaydedildi', { 
          sensor_id, 
          temperature, 
          humidity, 
          timestamp 
        });
      } catch (err) {
        logger.error('MQTT mesaj işleme hatası', { 
          error: err.message,
          topic,
          message: message.toString()
        });
      }
    });

    this.client.on('error', (err) => {
      logger.error('MQTT bağlantı hatası', { error: err.message });
    });

    this.client.on('close', () => {
      logger.warn('MQTT bağlantısı kapandı');
    });

    this.client.on('reconnect', () => {
      logger.info('MQTT yeniden bağlanma denemesi');
    });
  }
}

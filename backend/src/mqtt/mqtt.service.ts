import { Injectable, OnModuleInit } from '@nestjs/common';
import * as mqtt from 'mqtt';
import { SensorDataService } from '../sensor-data/sensor-data.service';
import { logger } from '../config/logger';

@Injectable()
export class MqttService implements OnModuleInit {
  private client;

  constructor(private readonly sensorDataService: SensorDataService) {}

  onModuleInit() {
    logger.info('MQTT servisi başlatılıyor');
    this.connectAndSubscribe();
  }

  private connectAndSubscribe() {
    logger.info('MQTT broker\'a bağlanılıyor: mqtt://localhost:1883');
    this.client = mqtt.connect('mqtt://localhost:1883');

    this.client.on('connect', () => {
      logger.info('MQTT bağlantısı kuruldu');
      
      // Tüm factory/temperature konularına abone ol
      this.client.subscribe('factory/temperature/#', (err) => {
        if (err) {
          logger.error('MQTT subscribe hatası', { error: err.message });
        } else {
          logger.info('MQTT topic\'e abone olundu', { topic: 'factory/temperature/#' });
        }
      });
      
      // Özellikle test konusuna abone ol
      this.client.subscribe('factory/temperature/test', (err) => {
        if (err) {
          logger.error('MQTT test topic subscribe hatası', { error: err.message });
        } else {
          logger.info('MQTT test topic\'e abone olundu', { topic: 'factory/temperature/test' });
        }
      });
    });

    this.client.on('message', async (topic, message) => {
      try {
        logger.info('Ham MQTT mesajı alındı', { 
          topic, 
          messageStr: message.toString() 
        });
        
        const payload = JSON.parse(message.toString());
        logger.debug('MQTT mesajı işleniyor', { topic, payload });

        // Basit doğrulama
        const { sensor_id, temperature, humidity, timestamp } = payload;
        if (!sensor_id || temperature === undefined || humidity === undefined || !timestamp) {
          logger.warn('Eksik veri alındı', { payload });
          return;
        }

        // Veritabanına kaydet
        logger.info('Sensör verisi veritabanına kaydediliyor', { sensor_id });
        
        try {
          const result = await this.sensorDataService.create({
            sensor_id,
            temperature,
            humidity,
            timestamp,
          });
          
          logger.info('Sensör verisi başarıyla kaydedildi', { 
            sensor_id, 
            data_id: result.id 
          });
        } catch (dbErr) {
          logger.error('Veritabanı kaydetme hatası', { 
            error: dbErr.message,
            sensor_id,
            details: dbErr.details || 'Detay yok'
          });
          throw dbErr;
        }
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

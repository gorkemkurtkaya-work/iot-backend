const mqtt = require('mqtt');
const moment = require('moment-timezone');

const client = mqtt.connect('mqtt://localhost:1883');

// Senin sensör ID’lerin
const SENSOR_IDS = ['humidity_beta_01', 'humidity_beta_02', 'deneme_sensor_1'];

client.on('connect', () => {
  console.log('✅ MQTT Broker\'a bağlandı');

  setInterval(() => {
    const timestamp = moment().tz('Europe/Istanbul').format();

    const testMessage = {
      sensor_id: SENSOR_IDS[Math.floor(Math.random() * SENSOR_IDS.length)],
      temperature: +(Math.random() * (30 - 20) + 20).toFixed(2), // 20–30°C
      humidity: +(Math.random() * (60 - 40) + 40).toFixed(2),    // 40–60%
      timestamp: timestamp,
    };

    client.publish('factory/temperature/test', JSON.stringify(testMessage), (err) => {
      if (err) {
        console.error('📛 Mesaj gönderme hatası:', err);
      } else {
        console.log('📤 Veri gönderildi:', testMessage);
      }
    });

  }, 15000); // 15 saniyede bir gönder
});

client.on('error', (err) => {
  console.error('📛 MQTT Bağlantı hatası:', err);
  client.end();
});

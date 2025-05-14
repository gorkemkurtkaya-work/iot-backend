const mqtt = require('mqtt');
const moment = require('moment-timezone');
const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 3500;

// Express ayarları
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

const client = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  reconnectPeriod: 1000, // Bağlantı koparsa 1 saniyede tekrar dene
  rejectUnauthorized: false,
});

// Senin sensör ID'lerin
const SENSOR_IDS = ['humidity_beta_01', 'humidity_beta_02', 'deneme_sensor_1'];

let otomatikGondermeAktif = false;
let otomatikGondermeInterval = null;

// MQTT bağlantı eventi
client.on('connect', () => {
  console.log('✅ MQTT Broker\'a bağlandı');
});

// Sensör verisi gönderme fonksiyonu
function sensorVerisiGonder() {
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
  
  return testMessage;
}

// API endpoint'leri
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.post('/gonder', (req, res) => {
  try {
    const veri = sensorVerisiGonder();
    res.json({ success: true, message: 'Veri gönderildi', data: veri });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Hata: ' + error.message });
  }
});

app.post('/otomatik-gonder', (req, res) => {
  const { durum } = req.body;
  
  if (durum === 'baslat' && !otomatikGondermeAktif) {
    otomatikGondermeAktif = true;
    otomatikGondermeInterval = setInterval(sensorVerisiGonder, 15000);
    res.json({ success: true, message: 'Otomatik gönderme başlatıldı' });
  } 
  else if (durum === 'durdur' && otomatikGondermeAktif) {
    otomatikGondermeAktif = false;
    clearInterval(otomatikGondermeInterval);
    res.json({ success: true, message: 'Otomatik gönderme durduruldu' });
  }
  else {
    res.json({ success: false, message: 'Geçersiz istek' });
  }
});

// MQTT hata eventi
client.on('error', (err) => {
  console.error('📛 MQTT Bağlantı hatası:', err);
  client.end();
});

// Sunucuyu başlat
app.listen(port, () => {
  console.log(`Sunucu http://localhost:${port} adresinde çalışıyor`);
});
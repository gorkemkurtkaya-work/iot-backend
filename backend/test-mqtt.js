const mqtt = require('mqtt');

// MQTT istemcisi oluştur
const client = mqtt.connect('mqtt://localhost:1883');

// Bağlantı olaylarını dinle
client.on('connect', () => {
    console.log('MQTT Broker\'a bağlandı');
    
    // Test mesajı gönder - CreateSensorDataDto ile aynı yapıda olmalı
    const testMessage = {
        sensor_id: 'humidity_beta_01',
        temperature: 25.5,
        humidity: 60,
        timestamp: new Date().toISOString()
    };

    // Mesajı yayınla - konu yolunun mqtt.service.ts'deki abonelikle eşleştiğinden emin ol
    client.publish('factory/temperature/test', JSON.stringify(testMessage), (err) => {
        if (err) {
            console.error('Mesaj gönderme hatası:', err);
        } else {
            console.log('Test mesajı gönderildi:', testMessage);
            
            // İlgili konuya abone ol (opsiyonel - gelen mesajları kontrol etmek için)
            client.subscribe('factory/temperature/#', (subErr) => {
                if (subErr) {
                    console.error('Abone olma hatası:', subErr);
                    client.end();
                } else {
                    console.log('Konuya abone olundu: factory/temperature/#');
                    console.log('Mesajları 5 saniye dinledikten sonra bağlantı kapanacak');
                    setTimeout(() => client.end(), 5000); // 5 saniye bekle ve kapat
                }
            });
        }
    });
});

client.on('message', (topic, message) => {
    console.log('Alınan mesaj:', topic, JSON.parse(message.toString()));
});

client.on('error', (err) => {
    console.error('MQTT Bağlantı hatası:', err);
    client.end();
}); 
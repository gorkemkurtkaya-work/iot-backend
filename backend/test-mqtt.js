const mqtt = require('mqtt');

// MQTT istemcisi oluştur
const client = mqtt.connect('mqtt://localhost:1883');

// Bağlantı olaylarını dinle
client.on('connect', () => {
    console.log('MQTT Broker\'a bağlandı');
    
    // Test mesajı gönder
    const testMessage = {
        sensor_id: 'humidity_beta_01',
        temperature: 25.5,
        humidity: 60,
        timestamp: new Date().toISOString()
    };

    // Mesajı yayınla
    client.publish('factory/temperature/test', JSON.stringify(testMessage), (err) => {
        if (err) {
            console.error('Mesaj gönderme hatası:', err);
        } else {
            console.log('Test mesajı gönderildi:', testMessage);
        }
        
        // Bağlantıyı kapat
        client.end();
    });
});

client.on('error', (err) => {
    console.error('MQTT Bağlantı hatası:', err);
    client.end();
}); 
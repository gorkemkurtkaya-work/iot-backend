# MQTT Test Microservice

Bu mikroservis, MQTT broker'a bağlanarak test verileri gönderen bir uygulamadır.

## Ortam Değişkenleri

Uygulama aşağıdaki ortam değişkenlerini kullanır:

- `PORT`: Uygulamanın çalışacağı port (varsayılan: 8080)
- `MQTT_BROKER_URL`: MQTT broker adresi (örn. mqtts://hf99a092.ala.dedicated.aws.emqxcloud.com:8883)
- `MQTT_USERNAME`: MQTT kullanıcı adı
- `MQTT_PASSWORD`: MQTT şifresi

## API Endpoints

- `GET /`: Ana sayfa
- `GET /status`: MQTT bağlantı durumu ve sistem bilgileri
- `POST /gonder`: Test verisi gönder
- `POST /otomatik-gonder`: Otomatik veri gönderimi başlat/durdur
  - İstek gövdesi: `{ "durum": "baslat" }` veya `{ "durum": "durdur" }`
- `POST /reconnect`: MQTT bağlantısını yeniden başlat

## Docker ile Çalıştırma

```bash
# Docker imajı oluştur
docker build -t testmicroservice .

# Çalıştır
docker run -p 8080:8080 testmicroservice
```

## Cloud Run Deployment

Google Cloud Run'a deploy etmek için:

```bash
# Docker imajı oluştur ve Google Container Registry'ye gönder
gcloud builds submit --tag gcr.io/[PROJECT-ID]/testmicroservice

# Cloud Run'a deploy et
gcloud run deploy testmicroservice \
  --image gcr.io/[PROJECT-ID]/testmicroservice \
  --platform managed \
  --region europe-west1 \
  --allow-unauthenticated \
  --set-env-vars "MQTT_BROKER_URL=mqtts://hf99a092.ala.dedicated.aws.emqxcloud.com:8883,MQTT_USERNAME=mqtt,MQTT_PASSWORD=123456"
```

## Hata Ayıklama

MQTT bağlantı sorunları için şunları kontrol edin:

1. Broker URL'sinin doğru olduğundan emin olun (protokol dahil: mqtt:// veya mqtts://)
2. Kullanıcı adı ve şifrenin doğru olduğundan emin olun
3. Cloud Run'ın dışarıya bağlantı kurabildiğinden emin olun
4. `/status` endpoint'ini çağırarak bağlantı durumunu kontrol edin
5. Eğer bağlantı kurulamıyorsa, `/reconnect` endpoint'ini çağırarak bağlantıyı yeniden başlatın 
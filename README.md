# 🏭 IoT Sensör Takip Sistemi (NestJS + MQTT + Next.js + Socket.io + Supabase)

Bu proje, **fabrikalardaki IoT sensörlerinden gelen verileri MQTT protokolü üzerinden toplayan**, bu verileri **gerçek zamanlı yayınlayan**, **kullanıcı ve şirket yönetimi sağlayan**, **loglama ve güvenlik mekanizmaları içeren** kapsamlı bir sistemdir.

---

## 🚀 Canlı Linkler

| Servis | URL |
|--------|-----|
| 🧠 Backend (NestJS) | [https://iot-backend-559293271562.europe-west1.run.app](https://iot-backend-559293271562.europe-west1.run.app) |
| 💻 Frontend (Next.js) | [https://iot-frontend-559293271562.europe-west1.run.app](https://iot-frontend-559293271562.europe-west1.run.app) |
| 🧪 Test Microservice | [https://testmicroservice-hydust6b3a-ew.a.run.app](https://testmicroservice-hydust6b3a-ew.a.run.app) |

---

## 🎯 Proje Amacı

- Fabrikalardaki **IoT sensörlerinden gelen sıcaklık ve nem verilerini** toplamak
- Bu verileri **gerçek zamanlı olarak yayınlamak**
- Kullanıcıların yalnızca yetkili oldukları cihaz verilerine erişmelerini sağlamak
- **Loglama ve davranış takibi** ile kullanıcı aktivitelerini izlemek
- **EMQX MQTT Broker** üzerinden güvenli veri alışverişi sağlamak

---

## 🧱 Teknoloji Stack

### 🖥️ Backend
- **Framework:** NestJS (Node.js)
- **Veri Tabanı:** Supabase (PostgreSQL)
- **MQTT Broker:** EMQX Cloud (mqtts:// ile TLS)
- **Gerçek Zamanlı Veri Yayını:** MQTT + Socket.io
- **Güvenlik:** JWT Authentication
- **Logging:** Structured JSON Logging 
- **Containerization:** Docker + Google Cloud Run
- **Test:** MQTT simülasyon servisi

### 💻 Frontend
- **Next.js**
- **WebSocket üzerinden anlık veri güncelleme**

---

## 🧠 Sistem Mimarisi

### 👥 Kullanıcı Roller
- **System Admin:** Şirket, kullanıcı, cihaz ekleyebilir. Tüm loglara ve verilere erişebilir.
- **Company Admin:** Kendi şirketi için kullanıcı ve cihaz atamaları yapabilir, verileri ve logları görüntüleyebilir.
- **User:** Sadece yetkili olduğu cihazlardan gelen sensör verilerini görüntüleyebilir.

### 🔄 Sensör Verisi Akışı

1. Sensörler şu formatta veri gönderir:
```json
{
  "sensor_id": "temp_sensor_01",
  "timestamp": 1710772800,
  "temperature": 25.4,
  "humidity": 55.2
}
```
2. Backend, EMQX MQTT Broker’a abone olur.

3. Gelen veri doğrulanır → hatalıysa loglanır.

4. Doğru veri veritabanına yazılır.

5. Socket.io üzerinden ilgili kullanıcıya gerçek zamanlı iletilir.

### 🔐 Güvenlik Katmanları

- Tüm API'ler JWT ile korunur.

- MQTT bağlantısı TLS (mqtts://) ile güvenli hale getirilmiştir.

- Structured JSON loglama dosya sistemine yapılır.

- Kullanıcıların ve Şirketlerin sadece yetkili olduğu cihazlara erişimi vardır.

### 📑 Loglama & Kullanıcı Takibi

- Her kullanıcı log sayfasını her görüntülediğinde şu formatta kayıt oluşturulur:
```json
{
  "user_id": "user_123",
  "timestamp": 1710772800,
  "action": "viewed_logs"
}
```

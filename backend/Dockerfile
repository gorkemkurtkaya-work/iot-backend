FROM node:18-alpine

WORKDIR /app

# Bağımlılıkları kopyala ve yükle
COPY package*.json ./
RUN npm install

# Tüm dosyaları kopyala
COPY . .

# Gerekli port açılıyor
EXPOSE 5173

# Geliştirme modunda çalıştır (npm run dev)
CMD ["npm", "run", "start:dev"]
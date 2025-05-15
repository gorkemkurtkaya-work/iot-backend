import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';


// Projenin mimarisini göz önünde bulundurarak, entegrasyonlar modülünü oluşturmayı düşündüm ama sonra vazgeçtim. Çünkü zaten entegrasyonu yapıyorum sadece ek bir apiye ihtiyacım olmadığını düşündüğüm için iptal ettim.
// Şuan Entegrasyonlar kullanılabilir durumda ama frontend'de gösterimi mevcut değil. 
@Module({
  controllers: [IntegrationsController],
  providers: [IntegrationsService],
  exports: [IntegrationsService],
})
export class IntegrationsModule {} 
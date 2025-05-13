import { Controller, Get, Post, Put, Delete, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { IntegrationsService } from './integrations.service';

@Controller('integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get()
  async findAll(@Request() req) {
    // Kullanıcı rolüne göre entegrasyonları filtrele
    if (req.user.role === UserRole.SYSTEM_ADMIN) {
      return this.integrationsService.findAll();
    } else if (req.user.role === UserRole.COMPANY_ADMIN) {
      return this.integrationsService.findByCompanyId(req.user.company_id);
    } else {
      return this.integrationsService.findByUserId(req.user.id);
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const integration = await this.integrationsService.findOne(id);
    
    // Yetki kontrolü
    if (req.user.role === UserRole.SYSTEM_ADMIN) {
      return integration;
    } else if (req.user.role === UserRole.COMPANY_ADMIN && integration.company_id === req.user.company_id) {
      return integration;
    } else {
      throw new Error('Bu entegrasyona erişim yetkiniz yok');
    }
  }

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async create(@Body() createIntegrationDto: any, @Request() req) {
    // Company Admin sadece kendi şirketine entegrasyon ekleyebilir
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      createIntegrationDto.company_id = req.user.company_id;
    }
    return this.integrationsService.create(createIntegrationDto);
  }

  @Put(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async update(@Param('id') id: string, @Body() updateIntegrationDto: any, @Request() req) {
    const integration = await this.integrationsService.findOne(id);
    
    // Yetki kontrolü
    if (req.user.role === UserRole.COMPANY_ADMIN && integration.company_id !== req.user.company_id) {
      throw new Error('Bu entegrasyonu düzenleme yetkiniz yok');
    }
    
    // Company Admin sadece kendi şirketinin entegrasyonunu güncelleyebilir
    if (req.user.role === UserRole.COMPANY_ADMIN) {
      updateIntegrationDto.company_id = req.user.company_id;
    }
    
    return this.integrationsService.update(id, updateIntegrationDto);
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async remove(@Param('id') id: string, @Request() req) {
    const integration = await this.integrationsService.findOne(id);
    
    // Yetki kontrolü
    if (req.user.role === UserRole.COMPANY_ADMIN && integration.company_id !== req.user.company_id) {
      throw new Error('Bu entegrasyonu silme yetkiniz yok');
    }
    
    return this.integrationsService.remove(id);
  }

  @Patch(':id/status')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async updateStatus(@Param('id') id: string, @Body('status') status: string, @Request() req) {
    const integration = await this.integrationsService.findOne(id);
    
    // Yetki kontrolü
    if (req.user.role === UserRole.COMPANY_ADMIN && integration.company_id !== req.user.company_id) {
      throw new Error('Bu entegrasyonun durumunu değiştirme yetkiniz yok');
    }
    
    return this.integrationsService.updateStatus(id, status);
  }
} 
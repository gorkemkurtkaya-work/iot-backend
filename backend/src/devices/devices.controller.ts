import { Controller, Post, Get, Body, Param, Delete, NotFoundException, UseGuards } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Device } from './entities/device.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('devices')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async create(@Body() createDeviceDto: CreateDeviceDto): Promise<Device> {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  async findAll(): Promise<Device[]> {
    return this.devicesService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  async findById(@Param('id') id: string): Promise<Device> {
    const device = await this.devicesService.findById(id);
    if (!device) throw new NotFoundException('Cihaz bulunamadı');
    return device;
  }

  @Delete(':id')
  @Roles(UserRole.SYSTEM_ADMIN)
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.devicesService.delete(id);
    return { message: 'Cihaz silindi' };
  }
}

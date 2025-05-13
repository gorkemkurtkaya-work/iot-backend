import { Controller, Post, Get, Body, Param, Delete, NotFoundException } from '@nestjs/common';
import { DevicesService } from './devices.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { Device } from './entities/device.entity';

@Controller('devices')
export class DevicesController {
  constructor(private readonly devicesService: DevicesService) {}

  @Post()
  async create(@Body() createDeviceDto: CreateDeviceDto): Promise<Device> {
    return this.devicesService.create(createDeviceDto);
  }

  @Get()
  async findAll(): Promise<Device[]> {
    return this.devicesService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<Device> {
    const device = await this.devicesService.findById(id);
    if (!device) throw new NotFoundException('Cihaz bulunamadı');
    return device;
  }

  @Delete(':id')
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.devicesService.delete(id);
    return { message: 'Cihaz silindi' };
  }
}

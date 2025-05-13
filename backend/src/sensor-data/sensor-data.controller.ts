import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('sensor-data')
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) { }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN)
  async create(@Body() dto: CreateSensorDataDto) {
    return this.sensorDataService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN)
  async findAll() {
    return this.sensorDataService.findAll();
  }

  @Get(':sensor_id')
  @UseGuards(JwtAuthGuard)
  async findBySensor(@Param('sensor_id') sensor_id: string) {
    return this.sensorDataService.findBySensorId(sensor_id);
  }

  @Get('user/:user_id')
  @UseGuards(JwtAuthGuard)
  async findForUser(@Param('user_id') user_id: string) {
    return this.sensorDataService.findByUser(user_id);
  }
}

import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { SensorDataService } from './sensor-data.service';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';

@Controller('sensor-data')
export class SensorDataController {
  constructor(private readonly sensorDataService: SensorDataService) { }

  @Post()
  async create(@Body() dto: CreateSensorDataDto) {
    return this.sensorDataService.create(dto);
  }

  @Get()
  async findAll() {
    return this.sensorDataService.findAll();
  }

  @Get(':sensor_id')
  async findBySensor(@Param('sensor_id') sensor_id: string) {
    return this.sensorDataService.findBySensorId(sensor_id);
  }

  @Get('user/:user_id')
  async findForUser(@Param('user_id') user_id: string) {
    return this.sensorDataService.findByUser(user_id);
  }

}

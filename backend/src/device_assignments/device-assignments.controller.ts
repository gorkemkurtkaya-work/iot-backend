import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { DeviceAssignmentsService } from './device-assignments.service';
import { CreateDeviceAssignmentDto } from './dto/create-device-assignment.dto';

@Controller('device-assignments')
export class DeviceAssignmentsController {
  constructor(private readonly service: DeviceAssignmentsService) {}

  @Post()
  async assign(@Body() dto: CreateDeviceAssignmentDto) {
    return this.service.create(dto);
  }

  @Get('user/:user_id')
  async findByUser(@Param('user_id') user_id: string) {
    return this.service.findByUserId(user_id);
  }

  @Get('device/:device_id')
  async findByDevice(@Param('device_id') device_id: string) {
    return this.service.findByDeviceId(device_id);
  }
}

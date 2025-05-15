import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { DeviceAssignmentsService } from './device-assignments.service';
import { CreateDeviceAssignmentDto } from './dto/create-device-assignment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('device-assignments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DeviceAssignmentsController {
  constructor(private readonly service: DeviceAssignmentsService) {}

  @Post()
  @Roles(UserRole.SYSTEM_ADMIN)
  async assign(@Body() dto: CreateDeviceAssignmentDto) {
    return this.service.create(dto);
  }

  @Get('user/:user_id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  async findByUser(@Param('user_id') user_id: string) {
    return this.service.findByUserId(user_id);
  }

  @Get('device/:device_id')
  @Roles(UserRole.SYSTEM_ADMIN, UserRole.COMPANY_ADMIN, UserRole.USER)
  async findByDevice(@Param('device_id') device_id: string) {
    return this.service.findByDeviceId(device_id);
  }
}

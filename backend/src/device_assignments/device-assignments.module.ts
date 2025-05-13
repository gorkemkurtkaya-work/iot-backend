import { Module } from '@nestjs/common';
import { DeviceAssignmentsService } from './device-assignments.service';
import { DeviceAssignmentsController } from './device-assignments.controller';

@Module({
  controllers: [DeviceAssignmentsController],
  providers: [DeviceAssignmentsService],
  exports: [DeviceAssignmentsService],
})
export class DeviceAssignmentsModule {}

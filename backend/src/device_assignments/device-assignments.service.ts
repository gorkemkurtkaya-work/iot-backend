import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase';
import { CreateDeviceAssignmentDto } from './dto/create-device-assignment.dto';
import { DeviceAssignment } from './entities/device-assignment.entity';

@Injectable()
export class DeviceAssignmentsService {
  async create(dto: CreateDeviceAssignmentDto): Promise<DeviceAssignment> {
    const { data, error } = await supabase
      .from('device_assignments')
      .insert([dto])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findByUserId(user_id: string): Promise<DeviceAssignment[]> {
    const { data, error } = await supabase
      .from('device_assignments')
      .select('*')
      .eq('user_id', user_id);

    if (error) throw error;
    return data;
  }

  async findByDeviceId(device_id: string): Promise<DeviceAssignment[]> {
    const { data, error } = await supabase
      .from('device_assignments')
      .select('*')
      .eq('device_id', device_id);

    if (error) throw error;
    return data;
  }
}

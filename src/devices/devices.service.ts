import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase';
import { Device } from './entities/device.entity';
import { CreateDeviceDto } from './dto/create-device.dto';

@Injectable()
export class DevicesService {
  async create(deviceData: CreateDeviceDto): Promise<Device> {
    const { data, error } = await supabase
      .from('devices')
      .insert([deviceData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findAll(): Promise<Device[]> {
    const { data, error } = await supabase.from('devices').select('*');

    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}

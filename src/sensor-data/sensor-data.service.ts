import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase';
import { SensorData } from './entities/sensor-data.entity';
import { CreateSensorDataDto } from './dto/create-sensor-data.dto';

@Injectable()
export class SensorDataService {
  async create(data: CreateSensorDataDto): Promise<SensorData> {
    const { data: result, error } = await supabase
      .from('sensor_data')
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return result;
  }

  async findAll(): Promise<SensorData[]> {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }

  async findBySensorId(sensor_id: string): Promise<SensorData[]> {
    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('sensor_id', sensor_id)
      .order('timestamp', { ascending: false });

    if (error) throw error;
    return data;
  }
}

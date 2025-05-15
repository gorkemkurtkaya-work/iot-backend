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

  async findByUser(user_id: string): Promise<SensorData[]> {
    const { data: assignments, error: assignmentError } = await supabase
      .from('device_assignments')
      .select('device_id')
      .eq('user_id', user_id);
  
    if (assignmentError) throw assignmentError;
    const deviceIds = assignments.map((a) => a.device_id);
  
    const { data: devices, error: deviceError } = await supabase
      .from('devices')
      .select('sensor_id')
      .in('id', deviceIds);
  
    if (deviceError) throw deviceError;
    const sensorIds = devices.map((d) => d.sensor_id);
  
    const { data: sensorData, error: dataError } = await supabase
      .from('sensor_data')
      .select('*')
      .in('sensor_id', sensorIds)
      .order('timestamp', { ascending: false });
  
    if (dataError) throw dataError;
    return sensorData;
  }
}

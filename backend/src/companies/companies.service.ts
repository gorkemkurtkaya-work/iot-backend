import { Injectable, NotFoundException } from '@nestjs/common';
import { supabase } from '../config/supabase';
import { Company } from './entities/company.entity';

@Injectable()
export class CompaniesService {
  
  async create(name: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .insert([{ name }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }

  async findAll(): Promise<Company[]> {
    const { data, error } = await supabase
      .from('companies')
      .select('*');
      
    if (error) throw error;
    return data;
  }

  async findById(id: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw new NotFoundException('Şirket bulunamadı');
    return data;
  }

  async update(id: string, name: string): Promise<Company> {
    const { data, error } = await supabase
      .from('companies')
      .update({ name })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw new NotFoundException('Şirket bulunamadı');
    return data;
  }

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('companies')
      .delete()
      .eq('id', id);
      
    if (error) throw new NotFoundException('Şirket bulunamadı');
  }
}

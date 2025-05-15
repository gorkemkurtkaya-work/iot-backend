import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase';

@Injectable()
export class IntegrationsService {

  async findAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*, companies(*)');

    if (error) throw error;
    return data;
  }

  async findByCompanyId(companyId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*, companies(*)')
      .eq('company_id', companyId);

    if (error) throw error;
    return data;
  }

  async findByUserId(userId: string): Promise<any[]> {
    // Kullanıcının şirketini bul
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('company_id')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Kullanıcının şirketine ait entegrasyonları getir
    const { data, error } = await supabase
      .from('integrations')
      .select('*, companies(*)')
      .eq('company_id', userData.company_id);

    if (error) throw error;
    return data;
  }

  async findOne(id: string): Promise<any> {
    const { data, error } = await supabase
      .from('integrations')
      .select('*, companies(*)')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Entegrasyon bulunamadı');

    return data;
  }

  async create(createIntegrationDto: any): Promise<any> {
    const { data, error } = await supabase
      .from('integrations')
      .insert([{
        ...createIntegrationDto,
        status: 'inactive',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, updateIntegrationDto: any): Promise<any> {
    const { data, error } = await supabase
      .from('integrations')
      .update({
        ...updateIntegrationDto,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  async updateStatus(id: string, status: string): Promise<any> {
    if (!['active', 'inactive', 'error'].includes(status)) {
      throw new Error('Geçersiz durum');
    }

    const { data, error } = await supabase
      .from('integrations')
      .update({
        status,
        last_connection: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 
import { Injectable } from '@nestjs/common';
import { User } from './entities/user.entity';
import { supabase } from '../config/supabase';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  async create(userData: Partial<User>): Promise<User> {
    if (!userData.password) {
      throw new Error('Password is required');
    }
    
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          ...userData,
          password: hashedPassword,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) return null;
    return data;
  }

  async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return null;
    return data;
  }

  async updateCompany(id: string, company_id: string): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .update({ company_id })
      .eq('id', id)
      .select()
      .single();
  
    if (error) throw error;
    return data;
  }
} 
import { Injectable } from '@nestjs/common';
import { supabase } from '../config/supabase';
import { CreateUserLogDto } from './dto/create-user-log.dto';
import { UserLog } from './entities/user-log.entity';
import { logger } from '../config/logger';

@Injectable()
export class UserLogsService {
  async create(createUserLogDto: CreateUserLogDto): Promise<UserLog> {
    try {
      // Şu anki zamana 3 saat ekle
      const now = new Date();
      const turkeyTime = new Date(now.getTime() + (3 * 60 * 60 * 1000));

      const { data, error } = await supabase
        .from('user_logs')
        .insert([
          {
            user_id: createUserLogDto.user_id,
            action: createUserLogDto.action,
            timestamp: turkeyTime,
          },
        ])
        .select()
        .single();

      if (error) {
        logger.error('Kullanıcı log oluşturma hatası', { 
          error: error.message, 
          details: createUserLogDto 
        });
        throw error;
      }

      logger.info('Kullanıcı log kaydı oluşturuldu', { 
        user_id: createUserLogDto.user_id, 
        action: createUserLogDto.action 
      });

      return data;
    } catch (err) {
      logger.error('Beklenmeyen kullanıcı log hatası', { error: err.message });
      throw err;
    }
  }

  async findByUserId(userId: string): Promise<UserLog[]> {
    try {
      const { data, error } = await supabase
        .from('user_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Kullanıcı loglarını getirme hatası', { 
          error: error.message, 
          user_id: userId 
        });
        throw error;
      }

      return data;
    } catch (err) {
      logger.error('Beklenmeyen kullanıcı log sorgu hatası', { error: err.message });
      throw err;
    }
  }

  async findAll(): Promise<UserLog[]> {
    try {
      const { data, error } = await supabase
        .from('user_logs')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) {
        logger.error('Tüm kullanıcı loglarını getirme hatası', { error: error.message });
        throw error;
      }

      return data;
    } catch (err) {
      logger.error('Beklenmeyen tüm log sorgu hatası', { error: err.message });
      throw err;
    }
  }
} 
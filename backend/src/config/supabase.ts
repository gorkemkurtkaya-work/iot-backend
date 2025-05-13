import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();


export const supabaseConfig = {
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_KEY,
};

export const supabase = createClient(
  supabaseConfig.supabaseUrl || '',
  supabaseConfig.supabaseKey || ''
);
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();
console.log("Isi SUPABASE_URL:", process.env.SUPABASE_URL);
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);
import { createClient } from '@supabase/supabase-js';

// Estos datos los sacas de tu panel de Supabase: 
// Project Settings -> API
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

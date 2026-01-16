import { createClient } from '@supabase/supabase-js';

// Estos datos los sacas de tu panel de Supabase: 
// Project Settings -> API
const supabaseUrl = 'https://liyoivvgmtkzyttrlotk.supabase.co';
const supabaseAnonKey = 'sb_publishable_jpS0YIXtZKowgpyNwnONfg_cVa_g0ZF';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

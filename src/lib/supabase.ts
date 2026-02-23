import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qkgslevtxqsupaovmfsw.supabase.co';
const supabaseAnonKey = 'sb_publishable_o-69HOT-NVIaBPAo8xSdXg_SHSvPAvT';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

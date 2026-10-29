import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://licbhfbclgeuxqarutfe.supabase.co';
const supabaseAnonKey = 'sb_publishable_PrDKmj9vrXZdU6LLYgBHPw_gdMFWb5f';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

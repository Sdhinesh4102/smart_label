import { createClient } from '@supabase/supabase-js';

// Setup instructions: Create a .env file in the root of your project and add your keys there.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rdsokcdhecftrxebtrfs.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_mXXLWL-6ngqPE1B09NAJRQ_sxobVlH0';

export const supabase = createClient(supabaseUrl, supabaseKey);

// Typed Supabase client that bypasses auto-generated empty types.
// The auto-generated types.ts has empty Tables, so we cast the client
// to allow any table name until types are regenerated.
import { supabase as rawClient } from '@/integrations/supabase/client';
import type { SupabaseClient } from '@supabase/supabase-js';

// Re-export with `any` database type so .from('table_name') works
export const supabase = rawClient as unknown as SupabaseClient<any, 'public', any>;

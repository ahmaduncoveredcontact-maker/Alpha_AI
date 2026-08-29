import { createClient } from '@supabase/supabase-js';

// Use this for all backend API routes, webhooks, and cron jobs to bypass RLS
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

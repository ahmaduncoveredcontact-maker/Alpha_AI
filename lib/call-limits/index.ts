// lib/call-limits/index.ts
import { supabaseAdmin } from '@/lib/supabase/admin';

interface CallLimitCheck {
  allowed: boolean;
  remaining: number;
  reason?: string;
  limit: number;
  used: number;
  nextResetDate?: string;
}

export async function checkCallLimit(slug: string): Promise<CallLimitCheck> {
  // First, check if minutes should be reset
  await checkAndResetMinutes(slug);

  const { data: client, error } = await supabaseAdmin
    .from('clients')
    .select('call_minute_limit, minutes_used, call_priority, next_reset_date, plan_start_date')
    .eq('slug', slug)
    .single();

  if (error || !client) {
    return { 
      allowed: false, 
      remaining: 0, 
      reason: 'Client not found',
      limit: 0,
      used: 0
    };
  }

  const limit = client.call_minute_limit ?? 500;
  const used = client.minutes_used || 0;
  const remaining = Math.max(0, limit - used);

  if (limit === 0) {
    return { 
      allowed: true, 
      remaining: Infinity, 
      limit: 0, 
      used,
      nextResetDate: client.next_reset_date 
    };
  }

  if (remaining <= 0) {
    return { 
      allowed: false, 
      remaining: 0, 
      reason: `Call minute limit exceeded. Resets on ${new Date(client.next_reset_date).toLocaleDateString()}`,
      limit,
      used,
      nextResetDate: client.next_reset_date 
    };
  }

  return { 
    allowed: true, 
    remaining, 
    limit, 
    used,
    nextResetDate: client.next_reset_date 
  };
}

export async function incrementMinutesUsed(slug: string, minutes: number = 1): Promise<void> {
  const roundedMinutes = Math.ceil(minutes);
  
  const { data } = await supabaseAdmin
    .from('clients')
    .select('minutes_used')
    .eq('slug', slug)
    .single();
  
  if (data) {
    const currentUsed = data.minutes_used || 0;
    await supabaseAdmin
      .from('clients')
      .update({ minutes_used: currentUsed + roundedMinutes })
      .eq('slug', slug);
  }
}

// ── CHECK AND RESET INDIVIDUAL CLIENT ──────────────────────────────────

export async function checkAndResetMinutes(slug: string): Promise<void> {
  const { data: client } = await supabaseAdmin
    .from('clients')
    .select('next_reset_date, minutes_used')
    .eq('slug', slug)
    .single();

  if (!client) return;

  const nextReset = client.next_reset_date ? new Date(client.next_reset_date) : null;
  const now = new Date();

  if (nextReset && now >= nextReset) {
    // Reset minutes
    await supabaseAdmin
      .from('clients')
      .update({
        minutes_used: 0,
        last_reset_date: now.toISOString(),
        next_reset_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // +30 days
      })
      .eq('slug', slug);
    
    console.log(`🔄 Minutes reset for client: ${slug}`);
  }
}

// ── CHECK ALL CLIENTS (For Cron Job) ────────────────────────────────────

export async function checkAndResetAllClients(): Promise<number> {
  const { data: clients, error } = await supabaseAdmin
    .from('clients')
    .select('slug, next_reset_date, minutes_used')
    .not('next_reset_date', 'is', null);

  if (error || !clients) return 0;

  let resetCount = 0;
  const now = new Date();

  for (const client of clients) {
    const nextReset = new Date(client.next_reset_date);
    if (now >= nextReset) {
      await supabaseAdmin
        .from('clients')
        .update({
          minutes_used: 0,
          last_reset_date: now.toISOString(),
          next_reset_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('slug', client.slug);
      
      resetCount++;
    }
  }

  return resetCount;
}
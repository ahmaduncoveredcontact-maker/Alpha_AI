// types/client.ts
export interface Client {
  id: string;
  business_name: string;
  slug: string;
  phone?: string;
  email?: string;
  hours?: string;
  services?: string;
  price_ranges?: string;
  service_area?: string;
  website_contact_form_url?: string;
  review_business_name?: string;
  google_review_link?: string;
  qr_title?: string;
  qr_subtitle?: string;
  qr_tagline?: string;
  delivery_address?: string;
  access_code_hash: string;
  voice_instructions: string;
  vapi_assistant_id?: string;
  qr_main_url?: string;
  qr_wallpaper_url?: string;
  qr_sticker_url?: string;
  webhook_secret: string;
  webhook_url: string;
  outbound_calling_enabled: boolean;
  consent_confirmed: boolean;
  manager_access_granted: boolean;

  // NEW: Call minute limit fields
  call_minute_limit?: number;       // Monthly minute limit (0 = unlimited)
  call_priority?: string;           // "standard", "priority", "premium"
  minutes_used?: number;            // Total minutes used this cycle
  plan_start_date?: string;         // When the client joined
  next_reset_date?: string;         // When minutes will reset (30 days from join)
  last_reset_date?: string;         // Last time minutes were reset

  // Calendar fields
  working_hours_start?: string;
  working_hours_end?: string;
  working_days?: string[];
  timezone?: string;
  cal_event_slug?: string;
  day_times?: { [key: string]: { start: string; end: string } };

  // Google OAuth fields
  gbp_access_token?: string;
  gbp_refresh_token?: string;
  gbp_token_expiry?: string;

  created_at: string;
  updated_at: string;
}
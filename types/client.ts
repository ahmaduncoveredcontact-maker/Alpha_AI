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
  gbp_account_id?: string;
  gbp_location_id?: string;

  // NEW: Calendar fields
  working_hours_start?: string;    // Default start time (e.g., "09:00")
  working_hours_end?: string;      // Default end time (e.g., "17:00")
  working_days?: string[];         // Array of day names ["Monday", "Tuesday", ...]
  timezone?: string;               // IANA timezone (e.g., "America/New_York")
  cal_event_slug?: string;         // Cal.com event slug for booking

  // NEW: Per-day time overrides
  // Example: { "Monday": { start: "08:00", end: "16:00" }, "Tuesday": { start: "09:00", end: "18:00" } }
  day_times?: {
    [key: string]: {
      start: string;
      end: string;
    };
  };

  created_at: string;
  updated_at: string;
}
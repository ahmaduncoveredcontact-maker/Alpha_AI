-- clients table
CREATE TABLE IF NOT EXISTS clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  phone TEXT,
  email TEXT,
  hours TEXT,
  services TEXT,
  price_ranges TEXT,
  service_area TEXT,
  calendar_link TEXT,
  website_contact_form_url TEXT,
  review_business_name TEXT,
  google_review_link TEXT,
  delivery_address TEXT,
  access_code_hash TEXT NOT NULL,
  voice_instructions TEXT NOT NULL,
  vapi_assistant_id TEXT,
  qr_main_url TEXT,
  qr_wallpaper_url TEXT,
  qr_sticker_url TEXT,
  webhook_secret TEXT UNIQUE NOT NULL,
  webhook_url TEXT,
  outbound_calling_enabled BOOLEAN DEFAULT false,
  consent_confirmed BOOLEAN DEFAULT false,
  manager_access_granted BOOLEAN DEFAULT false,
  gbp_account_id TEXT,
  gbp_location_id TEXT,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
CREATE INDEX IF NOT EXISTS idx_clients_vapi_assistant_id ON clients(vapi_assistant_id);
CREATE INDEX IF NOT EXISTS idx_clients_webhook_secret ON clients(webhook_secret);

ALTER TABLE clients ADD COLUMN IF NOT EXISTS qr_title TEXT DEFAULT 'Review us on Google';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qr_subtitle TEXT DEFAULT 'Your feedback helps us improve and grow.';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS qr_tagline TEXT DEFAULT 'Good days start with coffee ??';

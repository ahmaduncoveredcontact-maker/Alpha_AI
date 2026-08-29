export interface CallLog {
  client_slug: string;
  timestamp: string;
  call_type: 'inbound' | 'outbound';
  customer_name: string;
  customer_phone: string;
  summary: string;
  status: 'Booked' | 'General Inquiry' | 'No Answer' | 'Rate Limited';
  booked_time?: string;
  recording_url?: string;
}

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AdminDashboardClient from '@/components/admin/AdminDashboardClient';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    redirect('/admin-login');
  }

  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, business_name, slug, created_at, vapi_assistant_id, qr_main_url')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div className="p-8 text-red-600">Error loading clients</div>;
  }

  return <AdminDashboardClient clients={clients || []} />;
}
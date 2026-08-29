import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditClientForm from '@/components/admin/EditClientForm';

export default async function EditClientPage({ params }: { params: { slug: string } }) {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    redirect('/admin-login');
  }

  const supabase = await createClient();
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('slug', params.slug)
    .single();

  if (error || !client) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit {client.business_name}</h1>
          <p className="text-gray-600 mt-1">Manage settings and preview the client dashboard.</p>
        </div>
        <EditClientForm client={client} />
      </div>
    </div>
  );
}
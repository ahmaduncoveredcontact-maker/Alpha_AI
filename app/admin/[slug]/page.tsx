import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import EditClientForm from '@/components/admin/EditClientForm';

export default async function EditClientPage({ params }: { params: { slug: string } }) {
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
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit {client.business_name}</h1>
      <EditClientForm client={client} />
    </div>
  );
}

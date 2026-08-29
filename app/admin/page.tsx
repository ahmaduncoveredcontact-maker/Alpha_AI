import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, business_name, slug, created_at, vapi_assistant_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div>Error loading clients</div>;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <Link href="/admin/new" className="bg-black text-white px-4 py-2 rounded">
          Add New Client
        </Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Business</th>
              <th className="p-2 text-left">Slug</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {clients?.map((client) => (
              <tr key={client.id} className="border-t">
                <td className="p-2">{client.business_name}</td>
                <td className="p-2">{client.slug}</td>
                <td className="p-2">
                  {client.vapi_assistant_id ? 'Active' : 'Setup pending'}
                </td>
                <td className="p-2">
                  <Link href={`/admin/${client.slug}`} className="text-blue-600 underline">
                    View/Edit
                  </Link>
                </td>
              </tr>
            ))}
            {!clients?.length && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-500">
                  No clients yet. Create your first client.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

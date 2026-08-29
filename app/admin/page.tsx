import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function AdminDashboardPage() {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    redirect('/admin-login');
  }

  const supabase = await createClient();
  const { data: clients, error } = await supabase
    .from('clients')
    .select('id, business_name, slug, created_at, vapi_assistant_id')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return <div className="text-red-600 p-4">Error loading clients</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <Link
            href="/admin/new"
            className="bg-black text-white px-6 py-3 rounded-lg shadow hover:bg-gray-800 transition-colors"
          >
            + Add New Client
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Business</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Slug</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Status</th>
                  <th className="px-6 py-3 text-left font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {clients?.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{client.business_name}</td>
                    <td className="px-6 py-4 text-gray-600">{client.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        client.vapi_assistant_id ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {client.vapi_assistant_id ? 'Active' : 'Setup pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-3">
                      <Link
                        href={`/admin/${client.slug}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/live/${client.slug}`}
                        className="text-indigo-600 hover:text-indigo-800 font-medium"
                      >
                        Dashboard
                      </Link>
                    </td>
                  </tr>
                ))}
                {!clients?.length && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      No clients yet. Create your first client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Pencil, ExternalLink, Users, CheckCircle, Clock, Trash2 } from 'lucide-react';

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

  const total = clients?.length || 0;
  const active = clients?.filter(c => c.vapi_assistant_id).length || 0;
  const pending = total - active;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <header className="bg-gradient-to-r from-gray-900 to-gray-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="bg-white/10 rounded-lg px-3 py-1.5">
              <span className="text-xl font-bold tracking-tight">α</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Alpha AI</h1>
              <p className="text-gray-300 text-sm">Admin dashboard</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm">
            <span className="text-gray-300 hidden sm:inline">Welcome back</span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-medium">Admin</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="text-sm text-gray-500 font-medium">Total Clients</div>
              <div className="text-3xl font-bold text-gray-800">{total}</div>
            </div>
            <div className="p-3 bg-indigo-50 rounded-full">
              <Users className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="text-sm text-gray-500 font-medium">Active</div>
              <div className="text-3xl font-bold text-emerald-600">{active}</div>
            </div>
            <div className="p-3 bg-emerald-50 rounded-full">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="text-sm text-gray-500 font-medium">Pending Setup</div>
              <div className="text-3xl font-bold text-amber-600">{pending}</div>
            </div>
            <div className="p-3 bg-amber-50 rounded-full">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>

        {/* Actions & Filters */}
        <div className="bg-white rounded-xl shadow-sm p-5 border border-gray-100 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-wrap gap-2">
              <Link
                href="/admin/new"
                className="bg-gray-900 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors shadow-sm inline-flex items-center gap-1.5"
              >
                <span className="text-lg leading-none">+</span> New Client
              </Link>
            </div>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search by business..."
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm w-full sm:w-48 focus:ring-2 focus:ring-gray-700 focus:border-transparent"
                id="searchInput"
              />
              <select
                className="border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-gray-700"
                id="statusFilter"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Clients Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" id="clientsTable">
              <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3.5 text-left">Business</th>
                  <th className="px-6 py-3.5 text-left">Slug</th>
                  <th className="px-6 py-3.5 text-left">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clients?.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors"
                      data-status={client.vapi_assistant_id ? 'active' : 'pending'}
                      data-name={client.business_name.toLowerCase()}>
                    <td className="px-6 py-4 font-medium text-gray-800">{client.business_name}</td>
                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{client.slug}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        client.vapi_assistant_id ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {client.vapi_assistant_id ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <Link
                        href={`/admin/${client.slug}`}
                        className="inline-flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <Link
                        href={`/live/${client.slug}`}
                        className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Dashboard
                      </Link>
                      <button
                        onClick={async () => {
                          if (!confirm(`⚠️ Are you sure you want to delete "${client.business_name}"? This action cannot be undone.`)) return;
                          if (!confirm(`Final confirmation: Delete "${client.business_name}" and all associated data?`)) return;
                          const res = await fetch(`/api/admin/clients/${client.slug}`, {
                            method: 'DELETE',
                          });
                          if (res.ok) {
                            // Refresh page or remove row
                            window.location.reload();
                          } else {
                            const err = await res.json();
                            alert(`Delete failed: ${err.error}`);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!clients?.length && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-400">
                      No clients yet. Create your first client.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <footer className="mt-6 text-center text-xs text-gray-400 border-t border-gray-200 pt-4">
          &copy; {new Date().getFullYear()} Alpha AI – All rights reserved.
        </footer>
      </main>

      <script dangerouslySetInnerHTML={{
        __html: `
          (function() {
            const searchInput = document.getElementById('searchInput');
            const statusFilter = document.getElementById('statusFilter');
            const table = document.getElementById('clientsTable');
            const rows = table.querySelectorAll('tbody tr');

            function filterTable() {
              const search = searchInput.value.toLowerCase().trim();
              const status = statusFilter.value;
              rows.forEach(row => {
                const rowStatus = row.dataset.status || '';
                const name = row.dataset.name || '';
                let show = true;
                if (search && !name.includes(search)) show = false;
                if (status !== 'all' && rowStatus !== status) show = false;
                row.style.display = show ? '' : 'none';
              });
            }

            searchInput.addEventListener('input', filterTable);
            statusFilter.addEventListener('change', filterTable);
          })();
        `
      }} />
    </div>
  );
}
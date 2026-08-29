import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import NewClientForm from '@/components/admin/NewClientForm';

export default async function NewClientPage() {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    redirect('/admin-login');
  }

  return <NewClientForm />;
}
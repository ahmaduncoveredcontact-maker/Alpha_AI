import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import ResultsClient from '@/components/admin/ResultsClient';

export default async function ResultsPage({ params }: { params: { slug: string } }) {
  // Auth check
  const cookieStore = await cookies();
  const session = cookieStore.get('admin_session');
  if (!session || session.value !== 'authenticated') {
    redirect('/admin-login');
  }

  return <ResultsClient slug={params.slug} />;
}
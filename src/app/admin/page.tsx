import type { Metadata } from 'next';
import { isAdminAuthenticated } from '@/lib/auth';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminDashboard from '@/components/admin/AdminDashboard';

export const metadata: Metadata = {
  title: 'Admin Dashboard - SmartCard',
  description: 'Manage smart NFC and QR review cards, track analytics, and generate bulk cards.',
};

// Force dynamic rendering since we are checking authentication cookies
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const authenticated = await isAdminAuthenticated();

  if (!authenticated) {
    return <AdminLogin />;
  }

  return <AdminDashboard />;
}

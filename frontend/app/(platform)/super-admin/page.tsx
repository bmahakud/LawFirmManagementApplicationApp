import { redirect } from 'next/navigation';

export default function SuperAdminRoot() {
  redirect('/super-admin/dashboard');
}

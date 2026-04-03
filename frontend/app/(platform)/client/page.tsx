import { redirect } from 'next/navigation';

export default function ClientRoot() {
  redirect('/client/dashboard');
}

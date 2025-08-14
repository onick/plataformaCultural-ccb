'use client';

import { useParams } from 'next/navigation';
import UserDetails from '@/components/users/UserDetails';

export default function UserDetailsPage() {
  const params = useParams();
  const userId = params.id as string;

  return <UserDetails userId={userId} />;
}
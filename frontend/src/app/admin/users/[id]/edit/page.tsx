'use client';

import { useParams } from 'next/navigation';
import { useUsersStore } from '@/stores/users';
import { useEffect } from 'react';
import UserForm from '@/components/users/UserForm';

export default function EditUserPage() {
  const params = useParams();
  const userId = params.id as string;
  const { currentUser, fetchUser } = useUsersStore();

  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  return (
    <div className="max-w-4xl mx-auto">
      <UserForm 
        mode="edit" 
        user={currentUser}
      />
    </div>
  );
}
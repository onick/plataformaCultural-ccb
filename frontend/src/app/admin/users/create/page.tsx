'use client';

import UserForm from '@/components/users/UserForm';

export default function CreateUserPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <UserForm mode="create" />
    </div>
  );
}
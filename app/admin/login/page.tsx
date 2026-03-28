import { Suspense } from 'react';
import AdminLoginForm from './AdminLoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Suspense fallback={<p>Loading login...</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}

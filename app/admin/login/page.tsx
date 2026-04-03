import { Suspense } from 'react';
import AdminLoginForm from './login-form';

export default function LoginPage() {
  return (
    <div className="p-5 font-sans max-w-4xl mx-auto bg-white dark:bg-gray-900 text-black dark:text-white">
      <Suspense fallback={<p>Loading login...</p>}>
        <AdminLoginForm />
      </Suspense>
    </div>
  );
}

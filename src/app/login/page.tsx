'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
// We will create this server action in a moment
import { login } from '@/app/actions'; 

export default function LoginPage() {
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    const result = await login(formData);
    if (result?.error) {
      setError(result.error);
    } else {
      // Success! Refresh to update UI and go home
      router.refresh(); 
      router.push('/');
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-2xl">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-slate-900">DM Access</h2>
          <p className="mt-2 text-sm text-slate-500">Speak friend and enter.</p>
        </div>

        <form action={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="password" className="sr-only">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="relative block w-full rounded-md border-0 py-3 text-slate-900 ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 pl-3"
              placeholder="Password"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 text-center font-bold">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="group relative flex w-full justify-center rounded-md bg-blue-600 px-3 py-3 text-sm font-semibold text-white hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Unlock World
          </button>
        </form>
      </div>
    </div>
  );
}
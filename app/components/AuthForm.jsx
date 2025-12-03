'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function AuthForm({ mode }) {
  const isSignup = mode === 'signup';
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const switchMode = (path) => {
    setFullName('');
    setEmail('');
    setPassword('');
    setError('');
    router.push(path);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (isSignup && fullName.trim().length < 2) {
      setError('Please enter your full name.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!password.trim()) {
      setError('Password is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = isSignup ? '/api/auth/signup' : '/api/auth/login';
      const payload = isSignup
        ? { name: fullName.trim(), email, password }
        : { email, password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 'Something went wrong. Please try again.'
        );
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white w-full max-w-md p-8 rounded-xl shadow-md border border-gray-100">
      <h2 className="text-lg font-semibold text-black">Welcome</h2>
      <p className="text-sm text-gray-500 mb-6">
        Join the movement for environmental action
      </p>

      <div className="flex bg-gray-100 rounded-full p-1 mb-6">
        <button
          type="button"
          onClick={() => switchMode('/login')}
          className={`flex-1 py-2 rounded-full text-sm ${
            mode === 'login' ? 'bg-white shadow font-semibold' : 'text-gray-500'
          }`}
        >
          <span className="text-black">Login</span>
        </button>

        <button
          type="button"
          onClick={() => switchMode('/signup')}
          className={`flex-1 py-2 rounded-full text-sm ${
            mode === 'signup'
              ? 'bg-white shadow font-semibold'
              : 'text-gray-500'
          }`}
        >
          <span className="text-black">Sign Up</span>
        </button>
      </div>

      <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
        {isSignup && (
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-800">
              Full Name
            </label>
            <input
              placeholder="John Doe"
              className="p-3 bg-gray-100 rounded border border-gray-200 text-black"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
        )}

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-800">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="p-3 bg-gray-100 rounded border border-gray-200 text-black"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="flex flex-col">
          <label className="text-sm font-medium text-gray-800">Password</label>
          <input
            type="password"
            className="p-3 bg-gray-100 rounded border border-gray-200 text-black"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? 'new-password' : 'current-password'}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-green-600 text-white py-3 rounded-lg mt-3 hover:bg-green-700 transition disabled:opacity-50"
        >
          {isSubmitting
            ? isSignup
              ? 'Creating...'
              : 'Logging in...'
            : isSignup
            ? 'Create Account'
            : 'Login'}
        </button>
      </form>
    </div>
  );
}

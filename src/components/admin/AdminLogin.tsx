'use client';

import React, { useState } from 'react';
import { Nfc, Lock, User, Eye, EyeOff, Loader2, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

export default function AdminLogin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both username and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        const errorMsg = data?.error || data?.message || 'Invalid username or password';
        setError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      toast.success('Authentication successful! Loading dashboard...');
      // Reload page so server component verifies the cookie
      window.location.reload();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 via-brand-50/30 to-slate-100 p-4">
      {/* Top back link */}
      <div className="mb-6 w-full max-w-md">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Homepage
        </Link>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm animate-fade-in">
        {/* Brand Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-500/25">
            <Nfc className="h-7 w-7" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-2">
            <ShieldCheck className="h-3.5 w-3.5" />
            Admin Portal
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Sign In to SmartCard
          </h1>
          <p className="mt-1.5 text-sm text-slate-500">
            Enter your administrator credentials to manage review cards
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 animate-fade-in flex items-start gap-2.5">
            <div className="mt-0.5 rounded-full bg-red-200 p-0.5 text-red-700">
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="flex-1">{error}</div>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="admin-username" className="label flex items-center gap-1.5">
              <User className="h-4 w-4 text-slate-400" />
              Admin Username
            </label>
            <div className="relative">
              <input
                id="admin-username"
                type="text"
                autoComplete="username"
                autoFocus
                required
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="e.g. admin"
                className="input-field"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="admin-password" className="label flex items-center gap-1.5">
                <Lock className="h-4 w-4 text-slate-400" />
                Password
              </label>
            </div>
            <div className="relative">
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="Enter admin password"
                className="input-field pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:text-slate-600 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3.5 text-base shadow-md hover:shadow-lg"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <Lock className="h-4 w-4" />
                <span>Sign In to Dashboard</span>
              </>
            )}
          </button>
        </form>

        {/* Footer credentials hint */}
        <div className="mt-8 rounded-xl bg-slate-50 border border-slate-100 p-3.5 text-center text-xs text-slate-500">
          <div className="flex items-center justify-center gap-1 font-medium text-slate-600 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
            <span>Default Test Credentials</span>
          </div>
          <div>
            Username: <code className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded">admin</code> • Password: <code className="font-mono text-slate-700 bg-slate-200/60 px-1 py-0.5 rounded">admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}

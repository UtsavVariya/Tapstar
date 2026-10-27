'use client';

import React, { useState } from 'react';
import { Nfc, Lock, Store, Check } from 'lucide-react';
import LoginForm from './LoginForm';
import SetupForm from './SetupForm';

interface ShopkeeperSetupProps {
  cardCode: string;
}

type Step = 'login' | 'setup';

export default function ShopkeeperSetup({ cardCode }: ShopkeeperSetupProps) {
  const [step, setStep] = useState<Step>('login');
  const [token, setToken] = useState<string>('');

  const handleLoginSuccess = (authToken: string) => {
    setToken(authToken);
    setStep('setup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8">
      {/* Top SmartCard Logo */}
      <div className="mb-6 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
          <Nfc className="h-5 w-5" />
        </div>
        <span className="text-xl font-bold tracking-tight text-slate-900">
          SmartCard <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-100 text-brand-700 ml-1">Setup</span>
        </span>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-lg bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 p-6 sm:p-8 transition-all duration-300">
        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            {/* Connecting line */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2 bg-slate-100 -z-0" />
            <div
              className="absolute top-1/2 left-0 h-0.5 -translate-y-1/2 bg-brand-600 transition-all duration-500 -z-0"
              style={{ width: step === 'setup' ? '100%' : '50%' }}
            />

            {/* Step 1 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === 'setup'
                    ? 'bg-green-600 text-white ring-4 ring-green-100'
                    : 'bg-brand-600 text-white ring-4 ring-brand-100'
                }`}
              >
                {step === 'setup' ? <Check className="w-4 h-4 stroke-[3]" /> : <Lock className="w-4 h-4" />}
              </div>
              <span className="mt-1.5 text-xs font-semibold text-slate-700">
                Step 1: Login
              </span>
            </div>

            {/* Step 2 */}
            <div className="relative z-10 flex flex-col items-center">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step === 'setup'
                    ? 'bg-brand-600 text-white ring-4 ring-brand-100'
                    : 'bg-slate-200 text-slate-500 ring-4 ring-slate-50'
                }`}
              >
                <Store className="w-4 h-4" />
              </div>
              <span
                className={`mt-1.5 text-xs font-semibold ${
                  step === 'setup' ? 'text-slate-700' : 'text-slate-400'
                }`}
              >
                Step 2: Profile
              </span>
            </div>
          </div>
        </div>

        {/* Content based on active step */}
        <div className="transition-opacity duration-300">
          {step === 'login' ? (
            <LoginForm
              cardCode={cardCode}
              onSuccess={handleLoginSuccess}
            />
          ) : (
            <SetupForm
              cardCode={cardCode}
              token={token}
            />
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="mt-8 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} SmartCard • Instant NFC & QR Business Setup
      </footer>
    </div>
  );
}

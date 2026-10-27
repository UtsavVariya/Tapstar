'use client';

import React, { useState } from 'react';
import {
  Store,
  FolderPlus,
  Sparkles,
  Star,
  MessageCircle,
  Instagram,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { isValidGoogleReviewUrl, formatWhatsAppUrl, formatInstagramUrl } from '@/lib/utils';

interface SetupFormProps {
  cardCode: string;
  token: string;
}

const CATEGORIES = [
  'Salon',
  'Restaurant',
  'Cafe',
  'Clothing Store',
  'Electronics',
  'Clinic',
  'Gym',
  'Bakery',
  'Other',
];

export default function SetupForm({ cardCode, token }: SetupFormProps) {
  const [shopName, setShopName] = useState('');
  const [businessCategory, setBusinessCategory] = useState(CATEGORIES[0]);
  const [keywords, setKeywords] = useState('');
  const [googleReviewUrl, setGoogleReviewUrl] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Non-blocking warning for Google Review URL format
  const showGoogleWarning =
    googleReviewUrl.trim().length > 0 && !isValidGoogleReviewUrl(googleReviewUrl.trim());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const trimmedShopName = shopName.trim();
    const trimmedGoogleUrl = googleReviewUrl.trim();

    if (!trimmedShopName) {
      setError('Please provide your business or shop name.');
      toast.error('Shop name is required.');
      return;
    }

    if (!trimmedGoogleUrl) {
      setError('Please provide your Google Review link.');
      toast.error('Google Review URL is required.');
      return;
    }

    setIsLoading(true);

    try {
      const formattedWhatsApp = whatsappUrl.trim()
        ? formatWhatsAppUrl(whatsappUrl.trim())
        : '';
      const formattedInstagram = instagramUrl.trim()
        ? formatInstagramUrl(instagramUrl.trim())
        : '';

      const response = await fetch(`/api/cards/${cardCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shop_name: trimmedShopName,
          business_category: businessCategory,
          keywords: keywords.trim(),
          google_review_url: trimmedGoogleUrl,
          whatsapp_url: formattedWhatsApp || null,
          instagram_url: formattedInstagram || null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data.error || 'Failed to save card profile. Please try again.';
        setError(errorMsg);
        toast.error(errorMsg);
        setIsLoading(false);
        return;
      }

      toast.success('Card configured successfully! Redirecting...');

      // Reload the page to transition into the customer smart view
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      console.error('Setup submission error:', err);
      const networkError = 'Network error while saving profile. Please try again.';
      setError(networkError);
      toast.error(networkError);
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 text-brand-600 mb-3 shadow-inner">
          <Store className="w-6 h-6" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold uppercase tracking-wider mb-2">
          Step 2 of 2 • Card: {cardCode}
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Setup Your Business Profile
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
          Configure how your customers will interact with this card when they tap or scan.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm text-red-700 animate-slide-up">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Shop Name */}
        <div>
          <label className="label" htmlFor="shop_name">
            Shop / Business Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Store className="w-4 h-4" />
            </div>
            <input
              id="shop_name"
              type="text"
              required
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Royal Men's Salon"
              className="input-field pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Business Category */}
        <div>
          <label className="label" htmlFor="business_category">
            Business Category <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <FolderPlus className="w-4 h-4" />
            </div>
            <select
              id="business_category"
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="input-field pl-10 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M7%207l3-3%203%203m0%206l-3%203-3-3%22%2F%3E%3C%2Fsvg%3E')] bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat pr-10"
              disabled={isLoading}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Helps our AI generate reviews that accurately match your business type.
          </p>
        </div>

        {/* Keywords */}
        <div>
          <label className="label" htmlFor="keywords">
            Keywords / Highlights
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Sparkles className="w-4 h-4 text-brand-500" />
            </div>
            <input
              id="keywords"
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. haircut, grooming, beard styling, friendly staff"
              className="input-field pl-10"
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Comma-separated services or strengths to mention in AI customer reviews.
          </p>
        </div>

        {/* Google Review URL */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="label mb-0" htmlFor="google_review_url">
              Google Review URL <span className="text-red-500">*</span>
            </label>
            <span className="text-[11px] font-medium text-brand-600">Required</span>
          </div>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-yellow-500">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
            </div>
            <input
              id="google_review_url"
              type="url"
              required
              value={googleReviewUrl}
              onChange={(e) => setGoogleReviewUrl(e.target.value)}
              placeholder="https://search.google.com/local/writereview?placeid=..."
              className={`input-field pl-10 ${
                showGoogleWarning ? 'border-amber-400 focus:border-amber-500' : ''
              }`}
              disabled={isLoading}
            />
          </div>
          <div className="mt-1.5 text-xs text-slate-500 flex items-start gap-1">
            <HelpCircle className="w-3.5 h-3.5 flex-shrink-0 text-slate-400 mt-0.5" />
            <span>
              Direct review link (e.g., <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">https://search.google.com/local/writereview?placeid=...</code> or <code className="text-slate-600 bg-slate-100 px-1 py-0.5 rounded">https://g.page/r/.../review</code>)
            </span>
          </div>

          {/* Non-blocking format warning */}
          {showGoogleWarning && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong>Notice:</strong> This URL doesn&apos;t match the typical Google Review shortlink format. Please test it to ensure customers can open the review dialog directly.
              </div>
            </div>
          )}
        </div>

        {/* WhatsApp URL or Number */}
        <div>
          <label className="label" htmlFor="whatsapp_url">
            WhatsApp Number or Link
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#25D366]">
              <MessageCircle className="w-4 h-4" />
            </div>
            <input
              id="whatsapp_url"
              type="text"
              value={whatsappUrl}
              onChange={(e) => setWhatsappUrl(e.target.value)}
              placeholder="+91 98765 43210 or https://wa.me/919876543210"
              className="input-field pl-10"
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Include country code (e.g. +91) or enter direct <code className="text-slate-600 bg-slate-100 px-1 rounded">https://wa.me/...</code> link.
          </p>
        </div>

        {/* Instagram URL or Handle */}
        <div>
          <label className="label" htmlFor="instagram_url">
            Instagram URL or Handle
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-500">
              <Instagram className="w-4 h-4" />
            </div>
            <input
              id="instagram_url"
              type="text"
              value={instagramUrl}
              onChange={(e) => setInstagramUrl(e.target.value)}
              placeholder="@shopname or https://instagram.com/shopname"
              className="input-field pl-10"
              disabled={isLoading}
            />
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Enter your Instagram username starting with @ or paste your profile URL.
          </p>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full mt-4 text-base"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Saving & Activating Card...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              <span>Save & Launch Card</span>
            </>
          )}
        </button>
      </form>

      {/* Info note */}
      <div className="mt-5 text-center">
        <p className="text-xs text-slate-400">
          You can update these details anytime by visiting this card URL with your credentials.
        </p>
      </div>
    </div>
  );
}

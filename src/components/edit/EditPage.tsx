'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Nfc,
  Lock,
  User,
  LogIn,
  Eye,
  EyeOff,
  Store,
  Tag,
  Hash,
  Star,
  MessageCircle,
  Instagram,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { CardData, SetupFormData } from '@/types';

interface EditPageProps {
  cardCode: string;
  shopName: string | null;
}

const BUSINESS_CATEGORIES = [
  'Salon & Barber',
  'Restaurant & Dining',
  'Cafe & Bistro',
  'Clothing & Apparel',
  'Retail & Grocery',
  'Healthcare & Clinic',
  'Dental Clinic',
  'Pharmacy',
  'Fitness & Gym',
  'Beauty, Spa & Wellness',
  'Electronics & Repairs',
  'Automotive & Mechanic',
  'Hotel & Hospitality',
  'Real Estate & Property',
  'Professional Services',
  'Education & Coaching',
  'Other',
];

/**
 * Normalizes phone numbers or partial URLs into a proper wa.me link
 */
function normalizeWhatsappInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://wa.me/') || trimmed.startsWith('http://wa.me/')) {
    return trimmed;
  }
  if (trimmed.startsWith('wa.me/')) {
    return `https://${trimmed}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // Strip everything except digits and optional leading plus
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length > 0) {
    return `https://wa.me/${digits}`;
  }
  return trimmed;
}

/**
 * Normalizes handles or partial URLs into a proper Instagram link
 */
function normalizeInstagramInput(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('https://instagram.com/') || trimmed.startsWith('http://instagram.com/')) {
    return trimmed;
  }
  if (trimmed.startsWith('instagram.com/')) {
    return `https://${trimmed}`;
  }
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  const cleanHandle = trimmed.replace(/^@+/, '');
  if (cleanHandle) {
    return `https://instagram.com/${cleanHandle}`;
  }
  return trimmed;
}

export default function EditPage({ cardCode, shopName }: EditPageProps) {
  const router = useRouter();

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState('');
  const [cardData, setCardData] = useState<CardData | null>(null);

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Edit Form State
  const [formData, setFormData] = useState<SetupFormData>({
    shop_name: shopName || '',
    business_category: '',
    keywords: '',
    google_review_url: '',
    whatsapp_url: '',
    instagram_url: '',
  });
  const [isSaving, setIsSaving] = useState(false);

  // Ensure initial or current business category is present in the category dropdown
  const categoryOptions = useMemo(() => {
    const list = [...BUSINESS_CATEGORIES];
    if (
      cardData?.business_category &&
      !list.some((c) => c.toLowerCase() === cardData.business_category?.toLowerCase())
    ) {
      list.unshift(cardData.business_category);
    }
    return list;
  }, [cardData?.business_category]);

  // Handle Step 1: Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!username.trim() || !password) {
      setLoginError('Please enter both username and password.');
      return;
    }

    setIsLoggingIn(true);

    try {
      const response = await fetch('/api/auth/shopkeeper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          card_code: cardCode,
          username: username.trim(),
          password,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        const message = data?.error || data?.message || 'Invalid username or password.';
        setLoginError(message);
        toast.error(message);
        setIsLoggingIn(false);
        return;
      }

      // Check token returned in data or data.token
      const receivedToken = data?.token || data?.data?.token || '';
      if (!receivedToken) {
        setLoginError('Authentication token missing from response.');
        toast.error('Authentication failed.');
        setIsLoggingIn(false);
        return;
      }

      // Fetch full card data from /api/cards/{card_code}
      const cardResponse = await fetch(`/api/cards/${cardCode}`, {
        headers: {
          Authorization: `Bearer ${receivedToken}`,
        },
      });

      if (!cardResponse.ok) {
        const cardErr = await cardResponse.json().catch(() => null);
        const errMsg = cardErr?.error || 'Failed to fetch card details.';
        setLoginError(errMsg);
        toast.error(errMsg);
        setIsLoggingIn(false);
        return;
      }

      const cardResult = await cardResponse.json().catch(() => null);
      const fullCard: CardData = cardResult?.data || cardResult?.card || cardResult;

      if (!fullCard) {
        setLoginError('Card information could not be retrieved.');
        toast.error('Card retrieval failed.');
        setIsLoggingIn(false);
        return;
      }

      // Successfully authenticated and retrieved card data
      setToken(receivedToken);
      setCardData(fullCard);
      setFormData({
        shop_name: fullCard.shop_name || shopName || '',
        business_category: fullCard.business_category || BUSINESS_CATEGORIES[0],
        keywords: fullCard.keywords || '',
        google_review_url: fullCard.google_review_url || '',
        whatsapp_url: fullCard.whatsapp_url || '',
        instagram_url: fullCard.instagram_url || '',
      });
      setIsAuthenticated(true);
      toast.success('Logged in successfully!');
    } catch (err) {
      console.error('Login error:', err);
      const msg = 'Network error during authentication. Please try again.';
      setLoginError(msg);
      toast.error(msg);
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Handle Step 2: Edit Form Submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.shop_name.trim()) {
      toast.error('Shop Name is required.');
      return;
    }

    if (!formData.google_review_url.trim()) {
      toast.error('Google Review URL is required.');
      return;
    }

    setIsSaving(true);

    const formattedWhatsapp = normalizeWhatsappInput(formData.whatsapp_url);
    const formattedInstagram = normalizeInstagramInput(formData.instagram_url);

    const payload = {
      shop_name: formData.shop_name.trim(),
      business_category: formData.business_category || null,
      keywords: formData.keywords.trim() || null,
      google_review_url: formData.google_review_url.trim(),
      whatsapp_url: formattedWhatsapp || null,
      instagram_url: formattedInstagram || null,
    };

    try {
      const response = await fetch(`/api/cards/${cardCode}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMsg = result?.error || result?.message || 'Failed to update card details.';
        toast.error(errorMsg);
        setIsSaving(false);
        return;
      }

      const updatedCard: CardData = result?.data || result?.card || {
        ...cardData,
        ...payload,
      };

      setCardData((prev) => (prev ? { ...prev, ...updatedCard } : updatedCard));
      setFormData((prev) => ({
        ...prev,
        whatsapp_url: formattedWhatsapp,
        instagram_url: formattedInstagram,
      }));

      toast.success('Card settings updated successfully!');
    } catch (err) {
      console.error('Save error:', err);
      toast.error('An error occurred while saving your changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-md w-full">
        {/* Top Branding Header */}
        <div className="mb-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 transition-transform hover:scale-105"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-500/20">
              <Nfc className="h-5 w-5" />
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">SmartCard</span>
          </Link>
          <p className="mt-1 text-xs text-slate-500">Shopkeeper Management Portal</p>
        </div>

        {!isAuthenticated ? (
          /* ======================================================== */
          /* STEP 1: LOGIN                                            */
          /* ======================================================== */
          <div className="card shadow-lg border-slate-200/80 transition-all">
            <div className="mb-6 border-b border-slate-100 pb-5 text-center">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700 mb-3">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Card ID: {cardCode}</span>
              </div>
              <h1 className="text-xl font-bold text-slate-900">Shopkeeper Login</h1>
              <p className="mt-1 text-sm text-slate-500">
                {shopName ? `Sign in to manage ${shopName}` : 'Sign in to edit your card settings'}
              </p>
            </div>

            {loginError && (
              <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-50 p-3.5 text-sm text-red-700 border border-red-100">
                <AlertCircle className="h-5 w-5 shrink-0 text-red-500 mt-0.5" />
                <div className="flex-1 font-medium">{loginError}</div>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="label" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    id="username"
                    name="username"
                    type="text"
                    required
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your card username"
                    className="input-field pl-10"
                    disabled={isLoggingIn}
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="password">
                  Password
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="input-field pl-10 pr-10"
                    disabled={isLoggingIn}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoggingIn || !username.trim() || !password}
                  className="btn-primary w-full shadow-md"
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4" />
                      Sign In & Configure
                    </>
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 border-t border-slate-100 pt-4 text-center">
              <Link
                href={`/c/${cardCode}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline"
              >
                View your card page <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          /* ======================================================== */
          /* STEP 2: EDIT FORM & STATS                                */
          /* ======================================================== */
          <div className="space-y-6">
            {/* Header info card */}
            <div className="card shadow-sm border-slate-200/80 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {cardCode}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Configured
                    </span>
                  </div>
                  <h1 className="mt-2 text-xl font-bold text-slate-900 leading-tight">
                    {formData.shop_name || shopName || 'Edit Card'}
                  </h1>
                </div>

                <Link
                  href={`/c/${cardCode}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 hover:bg-brand-50 hover:text-brand-600 transition-colors"
                  title="Preview Customer Page"
                >
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                <span className="text-slate-500">Shopkeeper Edit View</span>
                <Link
                  href={`/c/${cardCode}`}
                  className="font-medium text-brand-600 hover:text-brand-700 hover:underline flex items-center gap-1"
                >
                  View your card page &rarr;
                </Link>
              </div>
            </div>

            {/* Edit form */}
            <form onSubmit={handleSave} className="card shadow-lg border-slate-200/80 space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h2 className="text-base font-bold text-slate-900">Card Configuration</h2>
                <p className="text-xs text-slate-500">
                  Update your business profile, review links, and contact channels.
                </p>
              </div>

              {/* Shop Name */}
              <div>
                <label className="label" htmlFor="shop_name">
                  Shop Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Store className="h-4 w-4" />
                  </div>
                  <input
                    id="shop_name"
                    type="text"
                    required
                    value={formData.shop_name}
                    onChange={(e) =>
                      setFormData({ ...formData, shop_name: e.target.value })
                    }
                    placeholder="e.g., Royal Men's Salon"
                    className="input-field pl-10"
                    disabled={isSaving}
                  />
                </div>
              </div>

              {/* Business Category */}
              <div>
                <label className="label" htmlFor="business_category">
                  Business Category
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Tag className="h-4 w-4" />
                  </div>
                  <select
                    id="business_category"
                    value={formData.business_category}
                    onChange={(e) =>
                      setFormData({ ...formData, business_category: e.target.value })
                    }
                    className="input-field pl-10 cursor-pointer"
                    disabled={isSaving}
                  >
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <label className="label" htmlFor="keywords">
                  Keywords / Specialties
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                    <Hash className="h-4 w-4" />
                  </div>
                  <input
                    id="keywords"
                    type="text"
                    value={formData.keywords}
                    onChange={(e) =>
                      setFormData({ ...formData, keywords: e.target.value })
                    }
                    placeholder="e.g., haircut, beard trim, grooming, styling"
                    className="input-field pl-10"
                    disabled={isSaving}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Separate with commas. Helps AI generate tailored 5-star customer reviews.
                </p>
              </div>

              {/* Google Review URL */}
              <div>
                <label className="label" htmlFor="google_review_url">
                  Google Review URL <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-amber-500">
                    <Star className="h-4 w-4 fill-amber-500" />
                  </div>
                  <input
                    id="google_review_url"
                    type="url"
                    required
                    value={formData.google_review_url}
                    onChange={(e) =>
                      setFormData({ ...formData, google_review_url: e.target.value })
                    }
                    placeholder="https://search.google.com/local/writereview?placeid=..."
                    className="input-field pl-10"
                    disabled={isSaving}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Customers are redirected here to paste their AI-generated review.
                </p>
              </div>

              {/* WhatsApp URL / Number */}
              <div>
                <label className="label" htmlFor="whatsapp_url">
                  WhatsApp URL or Number
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#25D366]">
                    <MessageCircle className="h-4 w-4 fill-[#25D366]/20" />
                  </div>
                  <input
                    id="whatsapp_url"
                    type="text"
                    value={formData.whatsapp_url}
                    onChange={(e) =>
                      setFormData({ ...formData, whatsapp_url: e.target.value })
                    }
                    placeholder="https://wa.me/919876543210 or 919876543210"
                    className="input-field pl-10"
                    disabled={isSaving}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Enter full wa.me link or phone number with country code.
                </p>
              </div>

              {/* Instagram URL / Handle */}
              <div>
                <label className="label" htmlFor="instagram_url">
                  Instagram URL or Handle
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-pink-500">
                    <Instagram className="h-4 w-4" />
                  </div>
                  <input
                    id="instagram_url"
                    type="text"
                    value={formData.instagram_url}
                    onChange={(e) =>
                      setFormData({ ...formData, instagram_url: e.target.value })
                    }
                    placeholder="https://instagram.com/yourhandle or @yourhandle"
                    className="input-field pl-10"
                    disabled={isSaving}
                  />
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Enter your Instagram link or @username.
                </p>
              </div>

              {/* Buttons */}
              <div className="pt-3 flex flex-col sm:flex-row gap-3">
                <button
                  type="submit"
                  disabled={isSaving || !formData.shop_name.trim()}
                  className="btn-primary flex-1 shadow-md order-1 sm:order-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving Changes...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/c/${cardCode}`)}
                  disabled={isSaving}
                  className="btn-secondary flex-1 order-2 sm:order-1"
                >
                  Cancel
                </button>
              </div>
            </form>

            {/* ======================================================== */}
            {/* STATS SECTION (Below Edit Form)                          */}
            {/* ======================================================== */}
            <div className="card shadow-sm border-slate-200/80 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Card Performance</h3>
                    <p className="text-xs text-slate-500">Customer engagement summary</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Total Scans */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-center transition-all hover:bg-slate-100/60">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-brand-600">
                    <QrCode className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {cardData?.scan_count ?? 0}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-slate-500">Total Scans</div>
                </div>

                {/* Review Clicks */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-center transition-all hover:bg-slate-100/60">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                    <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {cardData?.review_clicks ?? 0}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-slate-500">Review Clicks</div>
                </div>

                {/* WhatsApp Clicks */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-center transition-all hover:bg-slate-100/60">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-[#25D366]">
                    <MessageCircle className="h-5 w-5 fill-[#25D366]/20" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {cardData?.whatsapp_clicks ?? 0}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-slate-500">WhatsApp Clicks</div>
                </div>

                {/* Instagram Clicks */}
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5 text-center transition-all hover:bg-slate-100/60">
                  <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-pink-100 text-pink-600">
                    <Instagram className="h-5 w-5" />
                  </div>
                  <div className="text-2xl font-black text-slate-900 tracking-tight">
                    {cardData?.instagram_clicks ?? 0}
                  </div>
                  <div className="mt-0.5 text-xs font-medium text-slate-500">Instagram Clicks</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

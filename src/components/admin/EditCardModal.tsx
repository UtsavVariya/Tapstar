'use client';

import React, { useState, useEffect } from 'react';
import { X, Save, Store, Tag, Sparkles, Star, MessageCircle, Instagram, Loader2 } from 'lucide-react';
import { CardData } from '@/types';
import { toast } from 'sonner';

interface EditCardModalProps {
  card: CardData;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditCardModal({ card, onClose, onSaved }: EditCardModalProps) {
  const [formData, setFormData] = useState({
    shop_name: card.shop_name || '',
    business_category: card.business_category || '',
    keywords: card.keywords || '',
    google_review_url: card.google_review_url || '',
    whatsapp_url: card.whatsapp_url || '',
    instagram_url: card.instagram_url || '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, saving]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/cards/${encodeURIComponent(card.card_code)}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          shop_name: formData.shop_name.trim() || null,
          business_category: formData.business_category.trim() || null,
          keywords: formData.keywords.trim() || null,
          google_review_url: formData.google_review_url.trim() || null,
          whatsapp_url: formData.whatsapp_url.trim() || null,
          instagram_url: formData.instagram_url.trim() || null,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || data?.message || `Failed to update card (${res.status})`);
      }

      toast.success(`Card ${card.card_code} updated successfully`);
      onSaved();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update card';
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget && !saving) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-card-modal-title"
    >
      <div className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600">
              <Store className="h-5 w-5" />
            </div>
            <div>
              <h2 id="edit-card-modal-title" className="text-lg font-bold text-slate-900">
                Edit Card Details
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <span className="font-mono font-semibold text-brand-600">{card.card_code}</span>
                <span>•</span>
                <span>{card.username}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {/* Shop Information Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Business Profile
            </h3>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="shop_name" className="label flex items-center gap-1.5">
                  <Store className="h-4 w-4 text-slate-400" />
                  Shop / Business Name
                </label>
                <input
                  id="shop_name"
                  type="text"
                  name="shop_name"
                  value={formData.shop_name}
                  onChange={handleChange}
                  placeholder="e.g. Royal Men's Salon"
                  className="input-field"
                />
              </div>

              <div>
                <label htmlFor="business_category" className="label flex items-center gap-1.5">
                  <Tag className="h-4 w-4 text-slate-400" />
                  Business Category
                </label>
                <input
                  id="business_category"
                  type="text"
                  name="business_category"
                  value={formData.business_category}
                  onChange={handleChange}
                  placeholder="e.g. Salon, Restaurant, Cafe"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label htmlFor="keywords" className="label flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-slate-400" />
                Keywords / Services (comma-separated for AI reviews)
              </label>
              <textarea
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleChange}
                rows={2}
                placeholder="e.g. haircut, beard trim, friendly staff, hygienic, best barber"
                className="input-field resize-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                These keywords help generate customized 5-star AI review recommendations for customers.
              </p>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-5 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Links & Integrations
            </h3>

            {/* Google Review URL */}
            <div>
              <label htmlFor="google_review_url" className="label flex items-center gap-1.5">
                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                Google Review URL
              </label>
              <input
                id="google_review_url"
                type="url"
                name="google_review_url"
                value={formData.google_review_url}
                onChange={handleChange}
                placeholder="https://g.page/r/.../review or https://search.google.com/..."
                className="input-field font-mono text-xs"
              />
              <p className="mt-1 text-xs text-slate-400">
                Direct link where customers can submit Google reviews.
              </p>
            </div>

            {/* WhatsApp */}
            <div>
              <label htmlFor="whatsapp_url" className="label flex items-center gap-1.5">
                <MessageCircle className="h-4 w-4 text-emerald-600" />
                WhatsApp Link / Number
              </label>
              <input
                id="whatsapp_url"
                type="text"
                name="whatsapp_url"
                value={formData.whatsapp_url}
                onChange={handleChange}
                placeholder="https://wa.me/919876543210 or 9876543210"
                className="input-field font-mono text-xs"
              />
              <p className="mt-1 text-xs text-slate-400">
                Format: https://wa.me/91XXXXXXXXXX or phone number with country code.
              </p>
            </div>

            {/* Instagram */}
            <div>
              <label htmlFor="instagram_url" className="label flex items-center gap-1.5">
                <Instagram className="h-4 w-4 text-pink-600" />
                Instagram Link / Handle
              </label>
              <input
                id="instagram_url"
                type="text"
                name="instagram_url"
                value={formData.instagram_url}
                onChange={handleChange}
                placeholder="https://instagram.com/username or @username"
                className="input-field font-mono text-xs"
              />
              <p className="mt-1 text-xs text-slate-400">
                Format: https://instagram.com/username or handle.
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="sticky bottom-0 -mx-6 -mb-6 flex items-center justify-end gap-3 border-t border-slate-100 bg-white/95 px-6 py-4 backdrop-blur-md">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="btn-secondary py-2.5 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary py-2.5 text-sm"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

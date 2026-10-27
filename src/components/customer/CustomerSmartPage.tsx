'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Copy,
  ExternalLink,
  RefreshCw,
  Sparkles,
  Check,
  Instagram,
  ArrowRight,
  Loader2,
  Nfc,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { CardData } from '@/types';
import { formatWhatsAppUrl, formatInstagramUrl } from '@/lib/utils';

interface CustomerSmartPageProps {
  card: CardData;
}

// Inline official WhatsApp icon
function WhatsAppIcon({ className = 'w-5 h-5' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.888 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.405z" />
    </svg>
  );
}

// Fallback high quality 5-star reviews based on category
function getCategoryFallbackReviews(category?: string | null, shopName?: string | null): string[] {
  const name = shopName || 'this business';
  const cat = (category || '').toLowerCase();

  if (cat.includes('salon') || cat.includes('barber')) {
    return [
      `Best salon experience in town! Got a fantastic haircut and beard styling. Highly skilled staff and great vibe at ${name}.`,
      `Incredible service and attention to detail. The ambiance is clean and modern. Left feeling completely refreshed!`,
      `Always a 5-star experience! Professional, hygienic, and they take time to get everything right. Highly recommend.`,
      `Top-notch styling and welcoming staff. Definitely my new go-to place for all grooming services!`,
    ];
  }

  if (cat.includes('restaurant') || cat.includes('cafe') || cat.includes('food')) {
    return [
      `Outstanding food and delightful ambiance! Every dish was full of flavor and served fresh and prompt at ${name}.`,
      `Incredible dining experience! Friendly service, cozy atmosphere, and delicious recipes. Highly recommended!`,
      `Hands down one of the best food spots around! Amazing quality, great portions, and very courteous team.`,
      `Delicious food and top-tier hospitality. Will definitely be returning with family and friends!`,
    ];
  }

  if (cat.includes('clinic') || cat.includes('doctor') || cat.includes('health')) {
    return [
      `Extremely professional and caring doctor. Explained everything clearly and took time to address all my questions.`,
      `Excellent medical care with minimal waiting time. The clinic is spotless and the entire staff is compassionate.`,
      `Top quality diagnosis and consultation. Felt genuinely cared for and confident in the treatment provided.`,
      `Highly recommended healthcare provider! Attentive, trustworthy, and modern patient-first facility.`,
    ];
  }

  if (cat.includes('gym') || cat.includes('fitness')) {
    return [
      `Top-notch gym with modern equipment and motivating trainers! The best fitness environment in the area.`,
      `Super clean gym floor, energetic atmosphere, and very helpful staff. Love working out here every single day!`,
      `Great workout facility! Equipment is well-maintained and trainers genuinely focus on proper form and goals.`,
      `Spacious, well-equipped, and supportive fitness community. 5 stars all the way!`,
    ];
  }

  if (cat.includes('cloth') || cat.includes('fashion') || cat.includes('retail')) {
    return [
      `Wonderful shopping experience! Trendy collections, premium fabric quality, and courteous staff at ${name}.`,
      `Great variety of stylish clothing at affordable prices. Found exactly what I was looking for!`,
      `Super helpful team and beautiful store layout. Loved the customer service and fit recommendations!`,
      `High-quality fashion with the latest trends. Highly recommend visiting for all your wardrobe needs!`,
    ];
  }

  if (cat.includes('bakery') || cat.includes('cake')) {
    return [
      `Delicious fresh baked treats! The aroma alone is irresistible and the quality is extraordinary at ${name}.`,
      `The cakes and pastries are top-tier! Moist, wonderfully balanced, and made with the freshest ingredients.`,
      `Always fresh, delightful sweets and warm hospitality. My go-to bakery for every celebration!`,
      `Incredible quality and amazing flavor! The staff is courteous and the bakes are perfection.`,
    ];
  }

  // Generic fallback
  return [
    `Exceptional service and friendly staff at ${name}! Everything exceeded my expectations. Highly recommended!`,
    `Truly outstanding quality and top-notch customer care. Very satisfied with my overall experience!`,
    `Prompt, professional, and reliable. Handled everything with great care and attention to detail.`,
    `Outstanding experience from start to finish! 5 stars without hesitation — will definitely return.`,
  ];
}

export default function CustomerSmartPage({ card }: CustomerSmartPageProps) {
  // Parse cached reviews if available
  const initialReviews = React.useMemo(() => {
    if (card.cached_reviews) {
      try {
        const parsed = JSON.parse(card.cached_reviews);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.filter((r) => typeof r === 'string' && r.trim().length > 0);
        }
      } catch {
        // Fall back
      }
    }
    return getCategoryFallbackReviews(card.business_category, card.shop_name);
  }, [card.cached_reviews, card.business_category, card.shop_name]);

  const [reviews, setReviews] = useState<string[]>(initialReviews);
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isCopying, setIsCopying] = useState<boolean>(false);

  // Track scan once on mount
  const hasTrackedScanRef = useRef(false);

  const trackEvent = (
    eventType: 'scan' | 'review_click' | 'whatsapp_click' | 'instagram_click'
  ) => {
    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_code: card.card_code,
          event_type: eventType,
        }),
      }).catch((err) => {
        // Non-blocking tracking
        console.debug('Tracking event error:', err);
      });
    } catch {
      // Non-blocking
    }
  };

  useEffect(() => {
    if (hasTrackedScanRef.current) return;
    hasTrackedScanRef.current = true;
    trackEvent('scan');

    // If no cached_reviews originally came from card, trigger review generation
    if (!card.cached_reviews) {
      fetchReviewsFromApi();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReviewsFromApi = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ card_code: card.card_code }),
      });

      const data = await response.json();

      if (response.ok && data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
        setReviews(data.reviews.slice(0, 4));
        setSelectedIndex(0);
        toast.success('Generated fresh reviews!');
      } else if (response.ok && Array.isArray(data.reviews) && data.reviews.length > 0) {
        setReviews(data.reviews.slice(0, 4));
        setSelectedIndex(0);
        toast.success('Generated fresh reviews!');
      }
    } catch (err) {
      console.debug('Generate reviews error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Main Copy & Open Google action
  const handleCopyAndOpenGoogle = async () => {
    const selectedReview = reviews[selectedIndex] || '';
    if (!selectedReview) {
      toast.error('Please select a review first.');
      return;
    }

    if (!card.google_review_url) {
      toast.error('Google review link has not been configured yet.');
      return;
    }

    setIsCopying(true);

    try {
      // Copy to clipboard
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(selectedReview);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = selectedReview;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      toast.success('Review copied! Paste it on Google');
    } catch (copyErr) {
      console.debug('Clipboard copy failed:', copyErr);
      toast.info('Opening Google Review page...');
    }

    // Track review click
    trackEvent('review_click');

    // Wait 1.5 seconds, then open Google Review URL in new tab
    setTimeout(() => {
      window.open(card.google_review_url!, '_blank', 'noopener,noreferrer');
      setIsCopying(false);
    }, 1500);
  };

  // Write My Own Review directly
  const handleWriteMyOwn = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!card.google_review_url) {
      toast.error('Google review link has not been configured yet.');
      return;
    }
    trackEvent('review_click');
    window.open(card.google_review_url, '_blank', 'noopener,noreferrer');
  };

  // WhatsApp click handler
  const handleWhatsAppClick = () => {
    if (!card.whatsapp_url) return;
    trackEvent('whatsapp_click');
    const finalUrl = formatWhatsAppUrl(card.whatsapp_url);
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  // Instagram click handler
  const handleInstagramClick = () => {
    if (!card.instagram_url) return;
    trackEvent('instagram_click');
    const finalUrl = formatInstagramUrl(card.instagram_url);
    window.open(finalUrl, '_blank', 'noopener,noreferrer');
  };

  // Avatar initial letter
  const avatarLetter = (card.shop_name || 'S').trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50/60 via-slate-50 to-white text-slate-900 flex flex-col justify-between antialiased">
      {/* Mobile-first main container */}
      <main className="w-full max-w-md mx-auto px-4 py-6 sm:py-8 flex-1 flex flex-col gap-6 animate-fade-in">
        {/* ======================================================== */}
        {/* A. HEADER SECTION                                        */}
        {/* ======================================================== */}
        <header className="flex flex-col items-center text-center">
          {/* Logo or Fallback Letter Avatar */}
          {card.logo_url ? (
            <div className="relative mb-3">
              <img
                src={card.logo_url}
                alt={card.shop_name || 'Shop Logo'}
                className="w-20 h-20 rounded-2xl object-cover shadow-md border-2 border-white ring-2 ring-brand-100"
              />
            </div>
          ) : (
            <div className="relative mb-3">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-brand-600 via-brand-500 to-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-brand-500/25 ring-4 ring-brand-100">
                {avatarLetter}
              </div>
            </div>
          )}

          {/* Shop Name */}
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
            {card.shop_name || 'Welcome!'}
          </h1>

          {/* Category Badge */}
          {card.business_category && (
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <Sparkles className="w-3 h-3 text-brand-500" />
              <span>{card.business_category}</span>
            </div>
          )}
        </header>

        {/* ======================================================== */}
        {/* B. AI REVIEW SECTION (MAIN FOCUS)                        */}
        {/* ======================================================== */}
        <section className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-100 flex flex-col gap-4">
          {/* Heading & Subtext */}
          <div className="text-center">
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center justify-center gap-1.5">
              <span>⭐</span>
              <span>Leave a 5-Star Review</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Choose a review below or write your own
            </p>
          </div>

          {/* 4 Review Cards in Vertical List */}
          <div className="space-y-3">
            {reviews.map((reviewText, idx) => {
              const isSelected = selectedIndex === idx;
              return (
                <div
                  key={idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`review-card cursor-pointer select-none transition-all duration-200 ${
                    isSelected ? 'selected' : ''
                  }`}
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      setSelectedIndex(idx);
                    }
                  }}
                >
                  {/* Top row: 5 Stars + Selection Radio */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className="w-4 h-4 fill-amber-400 text-amber-400"
                        />
                      ))}
                    </div>

                    {/* Radio visual */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'border-2 border-brand-600 bg-brand-600 text-white shadow-sm'
                          : 'border-2 border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected ? (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      ) : null}
                    </div>
                  </div>

                  {/* Review Text */}
                  <p className="text-sm text-slate-700 leading-snug">
                    &ldquo;{reviewText}&rdquo;
                  </p>
                </div>
              );
            })}
          </div>

          {/* Action Button: Copy Review & Open Google */}
          <div className="pt-1 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleCopyAndOpenGoogle}
              disabled={isCopying}
              className="btn-primary w-full py-3.5 text-base font-bold shadow-md shadow-brand-500/20 active:scale-[0.98] transition-transform"
            >
              {isCopying ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-300 animate-pulse" />
                  <span>Review Copied! Opening Google...</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Review & Open Google</span>
                </>
              )}
            </button>

            {/* Sub-actions: Generate New Reviews & Write Own */}
            <div className="flex items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={fetchReviewsFromApi}
                disabled={isGenerating || isCopying}
                className="btn-secondary text-xs px-3.5 py-2 inline-flex items-center gap-1.5"
                title="Generate fresh AI reviews"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 text-slate-500 ${
                    isGenerating ? 'animate-spin' : ''
                  }`}
                />
                <span>{isGenerating ? 'Generating...' : 'Generate New Reviews'}</span>
              </button>

              <button
                type="button"
                onClick={handleWriteMyOwn}
                className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center gap-1 transition-colors"
              >
                <span>Write My Own Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </section>

        {/* ======================================================== */}
        {/* C. WHATSAPP & D. INSTAGRAM BUTTONS                       */}
        {/* ======================================================== */}
        {(card.whatsapp_url || card.instagram_url) && (
          <section className="space-y-3">
            {/* WhatsApp Button */}
            {card.whatsapp_url && (
              <button
                type="button"
                onClick={handleWhatsAppClick}
                className="btn-whatsapp w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold"
              >
                <WhatsAppIcon className="w-5 h-5" />
                <span>Chat on WhatsApp</span>
              </button>
            )}

            {/* Instagram Button */}
            {card.instagram_url && (
              <button
                type="button"
                onClick={handleInstagramClick}
                className="btn-instagram w-full flex items-center justify-center gap-2 py-3.5 text-base font-bold"
              >
                <Instagram className="w-5 h-5" />
                <span>Follow on Instagram</span>
              </button>
            )}
          </section>
        )}
      </main>

      {/* ======================================================== */}
      {/* FOOTER SECTION: 'Powered by SmartCard'                   */}
      {/* ======================================================== */}
      <footer className="w-full text-center py-6 mt-4 border-t border-slate-100 bg-white/50 backdrop-blur-sm">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          <span>Powered by</span>
          <span className="font-semibold text-brand-600 inline-flex items-center gap-1">
            <Nfc className="w-3.5 h-3.5" />
            SmartCard
          </span>
        </a>
      </footer>
    </div>
  );
}

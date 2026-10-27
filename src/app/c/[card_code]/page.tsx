import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Nfc, AlertCircle, Clock, ArrowLeft, Home } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { CardData } from '@/types';
import { formatDate } from '@/lib/utils';
import ShopkeeperSetup from '@/components/customer/ShopkeeperSetup';
import CustomerSmartPage from '@/components/customer/CustomerSmartPage';

interface PageProps {
  params: { card_code: string } | Promise<{ card_code: string }>;
}

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const resolvedParams = await Promise.resolve(props.params);
  const card_code = resolvedParams.card_code;

  try {
    const card = await prisma.card.findUnique({
      where: { card_code },
    });

    if (!card) {
      return {
        title: 'Card Not Found | SmartCard',
        description: 'The requested smart review card does not exist.',
      };
    }

    if (!card.is_configured) {
      return {
        title: `Activate Card ${card.card_code} | SmartCard`,
        description: `Setup your NFC and QR business profile for card ${card.card_code}.`,
      };
    }

    const shopName = card.shop_name || 'Business Profile';
    const category = card.business_category ? ` - ${card.business_category}` : '';

    return {
      title: `${shopName}${category} | Leave a 5-Star Review`,
      description: `Leave a 5-star Google review, message on WhatsApp, or follow ${shopName} on Instagram.`,
      openGraph: {
        title: `${shopName} - Review & Connect`,
        description: `Leave a 5-star Google review, message on WhatsApp, or follow ${shopName} on Instagram.`,
        type: 'website',
        images: card.logo_url ? [{ url: card.logo_url }] : [],
      },
      twitter: {
        card: 'summary',
        title: `${shopName} - Review & Connect`,
        description: `Leave a 5-star Google review, message on WhatsApp, or follow ${shopName} on Instagram.`,
        images: card.logo_url ? [card.logo_url] : [],
      },
    };
  } catch (error) {
    console.error('generateMetadata error:', error);
    return {
      title: 'Smart Review Card',
      description: 'Connect with businesses and leave 5-star reviews instantly.',
    };
  }
}

export default async function CardPage(props: PageProps) {
  const resolvedParams = await Promise.resolve(props.params);
  const card_code = resolvedParams.card_code;

  // Direct Prisma query to fetch the card
  const card = await prisma.card.findUnique({
    where: { card_code },
  });

  // 1. Not Found State
  if (!card) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 mx-auto flex items-center justify-center mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold mb-3">
            Card Code: {card_code}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Card Not Found</h1>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            We couldn&apos;t find an active smart card with this identifier. It may be invalid, deactivated, or not yet registered.
          </p>
          <Link
            href="/"
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Expired State
  const isExpired = card.expires_at && new Date(card.expires_at).getTime() < Date.now();
  if (isExpired) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-100 shadow-xl p-8 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 mx-auto flex items-center justify-center mb-4">
            <Clock className="w-8 h-8" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold mb-3">
            Card Expired
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">This Card Has Expired</h1>
          <p className="text-sm text-slate-500 mb-2 leading-relaxed">
            The subscription for card <strong className="text-slate-700">{card.card_code}</strong> expired on{' '}
            <strong className="text-slate-700">
              {card.expires_at ? formatDate(card.expires_at) : 'the scheduled date'}
            </strong>.
          </p>
          <p className="text-xs text-slate-400 mb-6">
            Please contact the business owner or platform administrator to renew the card subscription.
          </p>
          <Link
            href="/"
            className="btn-secondary w-full inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Homepage</span>
          </Link>
        </div>
      </div>
    );
  }

  // 3. Unconfigured State -> Render ShopkeeperSetup
  if (!card.is_configured) {
    return <ShopkeeperSetup cardCode={card.card_code} />;
  }

  // 4. Configured State -> Render CustomerSmartPage
  // Map Prisma Card to CardData shared type (convert dates to ISO strings, omit password_hash)
  const cardData: CardData = {
    id: card.id,
    card_code: card.card_code,
    username: card.username,
    is_configured: card.is_configured,
    shop_name: card.shop_name,
    business_category: card.business_category,
    keywords: card.keywords,
    logo_url: card.logo_url,
    google_review_url: card.google_review_url,
    whatsapp_url: card.whatsapp_url,
    instagram_url: card.instagram_url,
    cached_reviews: card.cached_reviews,
    expires_at: card.expires_at ? card.expires_at.toISOString() : null,
    scan_count: card.scan_count,
    review_clicks: card.review_clicks,
    whatsapp_clicks: card.whatsapp_clicks,
    instagram_clicks: card.instagram_clicks,
    created_at: card.created_at.toISOString(),
    updated_at: card.updated_at.toISOString(),
  };

  return <CustomerSmartPage card={cardData} />;
}

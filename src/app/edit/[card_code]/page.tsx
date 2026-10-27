import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import EditPage from '@/components/edit/EditPage';

interface PageProps {
  params: {
    card_code: string;
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { card_code } = await Promise.resolve(params);

  try {
    const card = await prisma.card.findUnique({
      where: { card_code },
      select: { shop_name: true },
    });

    if (card?.shop_name) {
      return {
        title: `Edit Card - ${card.shop_name}`,
        description: `Manage and update details for ${card.shop_name}`,
      };
    }
  } catch (error) {
    console.error('Error fetching card for metadata:', error);
  }

  return {
    title: `Edit Card - ${card_code}`,
    description: 'Edit your Smart Review Card configuration and business details.',
  };
}

export default async function EditCardRoute({ params }: PageProps) {
  const { card_code } = await Promise.resolve(params);

  let card = null;
  try {
    card = await prisma.card.findUnique({
      where: { card_code },
    });

    // If not found directly, try case-insensitive uppercase lookup
    if (!card && card_code) {
      card = await prisma.card.findUnique({
        where: { card_code: card_code.toUpperCase() },
      });
    }
  } catch (error) {
    console.error('Error querying card:', error);
  }

  // If card not found, show 404 message
  if (!card) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-brand-50 via-white to-slate-50 flex items-center justify-center p-4">
        <div className="card w-full max-w-md text-center p-8 border border-slate-200/80 shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Card Not Found</h1>
          <p className="text-sm text-slate-600 mb-6">
            We couldn't find a card matching code{' '}
            <span className="font-mono font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
              {card_code}
            </span>
            . Please verify the link or QR code you scanned.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/" className="btn-primary w-full">
              <ArrowLeft className="h-4 w-4" /> Go to Homepage
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // If card is not configured (is_configured=false), redirect to /c/{card_code} since they should set it up there first
  if (!card.is_configured) {
    redirect(`/c/${card.card_code}`);
  }

  // If card is configured, render EditPage
  return <EditPage cardCode={card.card_code} shopName={card.shop_name} />;
}

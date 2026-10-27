import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { getCardUrl } from '@/lib/utils';

interface RouteContext {
  params: {
    card_code: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteContext) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const cardCode = decodeURIComponent(params.card_code).trim();

    const card = await prisma.card.findUnique({
      where: { card_code: cardCode },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    // Reset card and remove all card events in a single transaction
    const [_deleteResult, resetCard] = await prisma.$transaction([
      prisma.cardEvent.deleteMany({
        where: { card_id: card.id },
      }),
      prisma.card.update({
        where: { id: card.id },
        data: {
          shop_name: null,
          business_category: null,
          keywords: null,
          logo_url: null,
          google_review_url: null,
          whatsapp_url: null,
          instagram_url: null,
          cached_reviews: null,
          is_configured: false,
          scan_count: 0,
          review_clicks: 0,
          whatsapp_clicks: 0,
          instagram_clicks: 0,
        },
      }),
    ]);

    const { password_hash: _, ...safeCard } = resetCard;

    const formattedCard = {
      ...safeCard,
      created_at: safeCard.created_at.toISOString(),
      updated_at: safeCard.updated_at.toISOString(),
      expires_at: safeCard.expires_at ? safeCard.expires_at.toISOString() : null,
      full_url: getCardUrl(safeCard.card_code),
    };

    return NextResponse.json(
      {
        success: true,
        message: `Card ${cardCode} has been reset to unconfigured state`,
        data: formattedCard,
        card: formattedCard,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error resetting card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to reset card' },
      { status: 500 }
    );
  }
}

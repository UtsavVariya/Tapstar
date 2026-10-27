import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated, verifyShopkeeperToken } from '@/lib/auth';
import { formatWhatsAppUrl, formatInstagramUrl, getCardUrl } from '@/lib/utils';

interface RouteContext {
  params: {
    card_code: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
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

    // Check if tracking should be bypassed (e.g. for preview / edit page fetches)
    const searchParams = request.nextUrl.searchParams;
    const shouldTrack =
      searchParams.get('track') !== 'false' &&
      searchParams.get('no_track') !== 'true';

    let activeCard = card;

    if (shouldTrack) {
      const userAgent = request.headers.get('user-agent') || null;

      const [updatedCard] = await prisma.$transaction([
        prisma.card.update({
          where: { id: card.id },
          data: { scan_count: { increment: 1 } },
        }),
        prisma.cardEvent.create({
          data: {
            card_id: card.id,
            event_type: 'scan',
            user_agent: userAgent,
          },
        }),
      ]);

      activeCard = updatedCard;
    }

    const { password_hash: _, ...safeCard } = activeCard;

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
        data: formattedCard,
        card: formattedCard,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve card' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const cardCode = decodeURIComponent(params.card_code).trim();

    // 1. Authorization check: Admin token OR valid shopkeeper token for this card
    const isAdmin = await isAdminAuthenticated();
    let isAuthorizedShopkeeper = false;

    if (!isAdmin) {
      const authHeader = request.headers.get('authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7).trim();
        const payload = await verifyShopkeeperToken(token);
        if (payload && payload.cardCode.toLowerCase() === cardCode.toLowerCase()) {
          isAuthorizedShopkeeper = true;
        }
      }
    }

    if (!isAdmin && !isAuthorizedShopkeeper) {
      return NextResponse.json(
        {
          success: false,
          error: 'Unauthorized. Valid admin or shopkeeper authentication required.',
        },
        { status: 401 }
      );
    }

    // 2. Locate the existing card
    const existingCard = await prisma.card.findUnique({
      where: { card_code: cardCode },
    });

    if (!existingCard) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    // 3. Parse request body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const {
      shop_name,
      business_category,
      keywords,
      google_review_url,
      whatsapp_url,
      instagram_url,
    } = body;

    // 4. Format contact URLs using utility functions
    const formattedWhatsapp =
      whatsapp_url !== undefined && whatsapp_url !== null
        ? String(whatsapp_url).trim()
          ? formatWhatsAppUrl(String(whatsapp_url).trim())
          : null
        : existingCard.whatsapp_url;

    const formattedInstagram =
      instagram_url !== undefined && instagram_url !== null
        ? String(instagram_url).trim()
          ? formatInstagramUrl(String(instagram_url).trim())
          : null
        : existingCard.instagram_url;

    // 5. Update card in database
    const updatedCard = await prisma.card.update({
      where: { id: existingCard.id },
      data: {
        shop_name:
          shop_name !== undefined
            ? shop_name
              ? String(shop_name).trim()
              : null
            : existingCard.shop_name,
        business_category:
          business_category !== undefined
            ? business_category
              ? String(business_category).trim()
              : null
            : existingCard.business_category,
        keywords:
          keywords !== undefined
            ? keywords
              ? String(keywords).trim()
              : null
            : existingCard.keywords,
        google_review_url:
          google_review_url !== undefined
            ? google_review_url
              ? String(google_review_url).trim()
              : null
            : existingCard.google_review_url,
        whatsapp_url: formattedWhatsapp,
        instagram_url: formattedInstagram,
        is_configured: true,
      },
    });

    const { password_hash: _, ...safeCard } = updatedCard;

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
        message: 'Card configuration saved successfully',
        data: formattedCard,
        card: formattedCard,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update card configuration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteContext) {
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

    // Delete related events and card
    await prisma.$transaction([
      prisma.cardEvent.deleteMany({ where: { card_id: card.id } }),
      prisma.card.delete({ where: { id: card.id } }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: `Card ${cardCode} and associated events deleted successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete card' },
      { status: 500 }
    );
  }
}

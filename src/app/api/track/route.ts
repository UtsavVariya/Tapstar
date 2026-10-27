import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

const VALID_EVENT_TYPES = [
  'review_click',
  'whatsapp_click',
  'instagram_click',
  'scan',
] as const;

type TrackEventType = (typeof VALID_EVENT_TYPES)[number];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { card_code, event_type } = body;

    if (!card_code || !event_type) {
      return NextResponse.json(
        { success: false, error: 'Both card_code and event_type are required' },
        { status: 400 }
      );
    }

    const cleanCardCode = String(card_code).trim();
    const typedEventType = String(event_type).trim() as TrackEventType;

    if (!VALID_EVENT_TYPES.includes(typedEventType)) {
      return NextResponse.json(
        {
          success: false,
          error: `Invalid event_type. Allowed types: ${VALID_EVENT_TYPES.join(', ')}`,
        },
        { status: 400 }
      );
    }

    const card = await prisma.card.findUnique({
      where: { card_code: cleanCardCode },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    // Determine which metric counter to increment
    const updateData: Record<string, { increment: number }> = {};
    if (typedEventType === 'review_click') {
      updateData.review_clicks = { increment: 1 };
    } else if (typedEventType === 'whatsapp_click') {
      updateData.whatsapp_clicks = { increment: 1 };
    } else if (typedEventType === 'instagram_click') {
      updateData.instagram_clicks = { increment: 1 };
    } else if (typedEventType === 'scan') {
      updateData.scan_count = { increment: 1 };
    }

    const userAgent = request.headers.get('user-agent') || null;

    // Increment counter and create event log in a single transaction
    await prisma.$transaction([
      prisma.card.update({
        where: { id: card.id },
        data: updateData,
      }),
      prisma.cardEvent.create({
        data: {
          card_id: card.id,
          event_type: typedEventType,
          user_agent: userAgent,
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: `Event '${typedEventType}' tracked successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error tracking event:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to record event' },
      { status: 500 }
    );
  }
}

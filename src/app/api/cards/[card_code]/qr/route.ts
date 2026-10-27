import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';
import { prisma } from '@/lib/prisma';
import { getCardUrl } from '@/lib/utils';

interface RouteContext {
  params: {
    card_code: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const cardCode = decodeURIComponent(params.card_code).trim();

    // Verify that the card exists
    const card = await prisma.card.findUnique({
      where: { card_code: cardCode },
      select: { card_code: true },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    // Build the full customer destination URL
    const destinationUrl = getCardUrl(card.card_code);

    // Generate high-resolution PNG buffer
    const qrBuffer = await QRCode.toBuffer(destinationUrl, {
      type: 'png',
      width: 512,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a', // Slate 900
        light: '#ffffff', // Clean white background
      },
    });

    return new NextResponse(new Uint8Array(qrBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Length': qrBuffer.length.toString(),
        'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error) {
    console.error('Error generating QR code:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate QR code image' },
      { status: 500 }
    );
  }
}

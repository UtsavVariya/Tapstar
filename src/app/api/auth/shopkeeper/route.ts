import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyShopkeeperCredentials, createShopkeeperToken } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { card_code, username, password } = body;

    if (!card_code || !username || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'card_code, username, and password are all required',
        },
        { status: 400 }
      );
    }

    const trimmedCardCode = String(card_code).trim();
    const trimmedUsername = String(username).trim();
    const strPassword = String(password);

    // Rate limiting by client IP + card_code
    const headerList = headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (headerList.get('x-real-ip') || 'unknown');
    const rateLimitKey = getRateLimitKey('shopkeeper_login', `${clientIp}:${trimmedCardCode}`);
    const { allowed, resetInMs } = checkRateLimit(rateLimitKey, RATE_LIMITS.login);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil(resetInMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts for this card. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    // Lookup card in database
    const card = await prisma.card.findUnique({
      where: { card_code: trimmedCardCode },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials. Card not found.' },
        { status: 401 }
      );
    }

    // Verify credentials
    const isValid = await verifyShopkeeperCredentials(
      trimmedUsername,
      strPassword,
      card.username,
      card.password_hash
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Generate JWT token
    const token = await createShopkeeperToken(card.card_code);

    return NextResponse.json(
      {
        success: true,
        message: 'Shopkeeper authenticated successfully',
        token,
        data: {
          token,
          card_code: card.card_code,
          shop_name: card.shop_name,
          is_configured: card.is_configured,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Shopkeeper login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during shopkeeper login' },
      { status: 500 }
    );
  }
}

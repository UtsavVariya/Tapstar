import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated, hashPassword } from '@/lib/auth';
import { getCardUrl } from '@/lib/utils';

export async function GET() {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const cards = await prisma.card.findMany({
      orderBy: { created_at: 'desc' },
    });

    const safeCards = cards.map(({ password_hash, ...card }) => ({
      ...card,
      created_at: card.created_at.toISOString(),
      updated_at: card.updated_at.toISOString(),
      expires_at: card.expires_at ? card.expires_at.toISOString() : null,
      full_url: getCardUrl(card.card_code),
    }));

    return NextResponse.json(
      {
        success: true,
        data: safeCards,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching cards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve cards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

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

    const cleanCode = String(card_code).trim().toUpperCase();
    const cleanUsername = String(username).trim();
    const cleanPassword = String(password);

    if (!cleanCode || !cleanUsername || !cleanPassword) {
      return NextResponse.json(
        { success: false, error: 'Card code, username, and password cannot be empty' },
        { status: 400 }
      );
    }

    // Check if card_code is already in use
    const existingCard = await prisma.card.findUnique({
      where: { card_code: cleanCode },
    });

    if (existingCard) {
      return NextResponse.json(
        { success: false, error: `Card with code "${cleanCode}" already exists` },
        { status: 409 }
      );
    }

    // Hash the plain password
    const password_hash = await hashPassword(cleanPassword);

    // Create the new card record
    const newCard = await prisma.card.create({
      data: {
        card_code: cleanCode,
        username: cleanUsername,
        password_hash,
      },
    });

    const { password_hash: _, ...safeCard } = newCard;

    return NextResponse.json(
      {
        success: true,
        message: `Card ${cleanCode} created successfully`,
        data: {
          ...safeCard,
          created_at: safeCard.created_at.toISOString(),
          updated_at: safeCard.updated_at.toISOString(),
          expires_at: safeCard.expires_at ? safeCard.expires_at.toISOString() : null,
          full_url: getCardUrl(safeCard.card_code),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating card:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create card' },
      { status: 500 }
    );
  }
}

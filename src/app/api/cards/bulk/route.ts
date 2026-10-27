import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated, hashPassword } from '@/lib/auth';
import { generateCardCode, generateUsername, generatePassword, getCardUrl } from '@/lib/utils';

export async function POST(request: NextRequest) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { count = 10, prefix = 'CARD' } = body;

    const numCount = parseInt(String(count), 10);
    if (isNaN(numCount) || numCount < 1 || numCount > 500) {
      return NextResponse.json(
        {
          success: false,
          error: 'Count must be an integer between 1 and 500',
        },
        { status: 400 }
      );
    }

    const cleanPrefix = String(prefix || 'CARD').trim().toUpperCase();

    // Query existing codes and usernames to avoid collisions
    const existingCards = await prisma.card.findMany({
      select: { card_code: true, username: true },
    });

    const existingCodes = new Set(existingCards.map((c) => c.card_code.toUpperCase()));
    const existingUsernames = new Set(existingCards.map((c) => c.username.toLowerCase()));

    const dbRecords: { card_code: string; username: string; password_hash: string }[] = [];
    const plainCards: { card_code: string; username: string; password: string; full_url: string }[] = [];

    let usernameCounter = existingCards.length + 1;

    for (let i = 0; i < numCount; i++) {
      // 1. Generate unique card code
      let cardCode = '';
      let codeAttempts = 0;
      do {
        codeAttempts++;
        const length = codeAttempts > 60 ? 6 : 4;
        cardCode = generateCardCode(cleanPrefix, length).toUpperCase();
      } while (existingCodes.has(cardCode));
      existingCodes.add(cardCode);

      // 2. Generate unique username
      let username = '';
      do {
        username = generateUsername(usernameCounter++);
      } while (existingUsernames.has(username.toLowerCase()));
      existingUsernames.add(username.toLowerCase());

      // 3. Generate plain text password and hash
      const plainPassword = generatePassword(8);
      const password_hash = await hashPassword(plainPassword);

      dbRecords.push({
        card_code: cardCode,
        username,
        password_hash,
      });

      plainCards.push({
        card_code: cardCode,
        username,
        password: plainPassword,
        full_url: getCardUrl(cardCode),
      });
    }

    // Insert all cards in a transaction
    await prisma.$transaction(
      dbRecords.map((record) =>
        prisma.card.create({
          data: record,
        })
      )
    );

    return NextResponse.json(
      {
        success: true,
        message: `Successfully generated ${plainCards.length} cards`,
        cards: plainCards,
        data: {
          cards: plainCards,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error during bulk card generation:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate bulk cards' },
      { status: 500 }
    );
  }
}

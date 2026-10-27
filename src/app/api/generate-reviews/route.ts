import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';
import { generateFallbackReviews, normalizeCategory } from '@/lib/review-templates';

function parseReviewsArray(rawText: string): string[] | null {
  if (!rawText) return null;
  let clean = rawText.trim();

  // Strip code block wrappers if any
  if (clean.startsWith('```')) {
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  }

  try {
    const parsed = JSON.parse(clean);
    if (
      Array.isArray(parsed) &&
      parsed.length >= 4 &&
      parsed.every((item) => typeof item === 'string' && item.trim().length > 0)
    ) {
      return parsed.slice(0, 4).map((item: string) => item.trim());
    }
  } catch {
    // Attempt pattern-matching array fallback
    const arrayMatch = clean.match(/\[\s*"[\s\S]*"\s*\]/);
    if (arrayMatch) {
      try {
        const parsed = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsed) && parsed.length >= 4) {
          return parsed.slice(0, 4).map((item) => String(item).trim());
        }
      } catch {}
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { card_code } = body;
    if (!card_code) {
      return NextResponse.json(
        { success: false, error: 'card_code is required' },
        { status: 400 }
      );
    }

    const cleanCardCode = String(card_code).trim();

    // Rate Limiting by client IP + card_code
    const headerList = headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (headerList.get('x-real-ip') || 'unknown');
    const rateLimitKey = getRateLimitKey('apiReviews', `${clientIp}:${cleanCardCode}`);
    const { allowed, resetInMs } = checkRateLimit(rateLimitKey, RATE_LIMITS.apiReviews);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil(resetInMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded for generating reviews. Please wait a moment.',
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
      where: { card_code: cleanCardCode },
    });

    if (!card) {
      return NextResponse.json(
        { success: false, error: 'Card not found' },
        { status: 404 }
      );
    }

    const shopName = card.shop_name?.trim() || 'Our Store';
    const businessCategory = card.business_category?.trim() || 'Business';
    const keywords = card.keywords?.trim() || businessCategory;

    const systemPrompt = `You are a helpful customer review assistant. Generate 4 distinct, natural, authentic-sounding 5-star Google reviews (15 to 35 words each) for a business named '${shopName}' in the category '${businessCategory}' with highlights '${keywords}'. Make each review sound like it was written by a real happy customer: Option 1: Focus on product/service quality and overall satisfaction. Option 2: Focus on polite staff, quick service, and welcoming atmosphere. Option 3: Short, punchy, and enthusiastic recommendation. Option 4: Focus on great value for money and why they will visit again. Return the output strictly as a JSON array of 4 strings.`;

    let generatedReviews: string[] | null = null;
    let source: 'ai' | 'template' = 'template';

    // 1. Try Gemini API first if configured
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    if (geminiApiKey) {
      try {
        const geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;
        const geminiRes = await fetch(geminiEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: systemPrompt }],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: 'application/json',
            },
          }),
        });

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (responseText) {
            const parsed = parseReviewsArray(responseText);
            if (parsed && parsed.length >= 4) {
              generatedReviews = parsed;
              source = 'ai';
            }
          }
        } else {
          console.warn('Gemini API call returned non-200 status:', geminiRes.status);
        }
      } catch (geminiError) {
        console.warn('Gemini API request failed:', geminiError);
      }
    }

    // 2. Try OpenAI API if Gemini was not available or failed
    const openAiApiKey = process.env.OPENAI_API_KEY?.trim();
    if (!generatedReviews && openAiApiKey) {
      try {
        const openAiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openAiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: 'Generate the reviews now.' },
            ],
            temperature: 0.7,
          }),
        });

        if (openAiRes.ok) {
          const openAiData = await openAiRes.json();
          const replyText = openAiData.choices?.[0]?.message?.content;
          if (replyText) {
            const parsed = parseReviewsArray(replyText);
            if (parsed && parsed.length >= 4) {
              generatedReviews = parsed;
              source = 'ai';
            }
          }
        } else {
          console.warn('OpenAI API call returned non-200 status:', openAiRes.status);
        }
      } catch (openAiError) {
        console.warn('OpenAI API request failed:', openAiError);
      }
    }

    // 3. Fall back to curated template-based reviews
    if (!generatedReviews) {
      const normalizedCat = normalizeCategory(businessCategory);
      generatedReviews = generateFallbackReviews(shopName, normalizedCat, keywords);
      source = 'template';
    }

    // Cache the reviews in the card's cached_reviews field
    await prisma.card.update({
      where: { id: card.id },
      data: {
        cached_reviews: JSON.stringify(generatedReviews),
      },
    });

    return NextResponse.json(
      {
        success: true,
        reviews: generatedReviews,
        source,
        data: {
          reviews: generatedReviews,
          source,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in review generation route:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate reviews' },
      { status: 500 }
    );
  }
}

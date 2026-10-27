import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { verifyAdminCredentials, createAdminToken } from '@/lib/auth';
import { checkRateLimit, getRateLimitKey, RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limiting by client IP
    const headerList = headers();
    const forwardedFor = headerList.get('x-forwarded-for');
    const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : (headerList.get('x-real-ip') || 'unknown');
    const rateLimitKey = getRateLimitKey('admin_login', clientIp);
    const { allowed, resetInMs } = checkRateLimit(rateLimitKey, RATE_LIMITS.adminLogin);

    if (!allowed) {
      const retryAfterSeconds = Math.ceil(resetInMs / 1000);
      return NextResponse.json(
        {
          success: false,
          error: 'Too many login attempts. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      );
    }

    // 2. Parse request body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { username, password } = body;
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // 3. Verify admin credentials against environment variables
    const isValid = await verifyAdminCredentials(username.trim(), password.trim());
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // 4. Create JWT admin token
    const token = await createAdminToken();

    // 5. Build response and set httpOnly cookie
    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin authenticated successfully',
        token,
      },
      { status: 200 }
    );

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return response;
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during admin login' },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const response = NextResponse.json(
      {
        success: true,
        message: 'Admin logged out successfully',
      },
      { status: 200 }
    );

    // Clear admin_token cookie
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch (error) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred during admin logout' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAdminAuthenticated } from '@/lib/auth';
import { getCardUrl } from '@/lib/utils';

function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

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
      orderBy: { created_at: 'asc' },
    });

    const headers = [
      'card_code',
      'full_url',
      'username',
      'password_hash',
      'shop_name',
      'status',
      'scan_count',
    ];

    const rows = cards.map((card) => [
      escapeCsv(card.card_code),
      escapeCsv(getCardUrl(card.card_code)),
      escapeCsv(card.username),
      escapeCsv(card.password_hash),
      escapeCsv(card.shop_name || ''),
      escapeCsv(card.is_configured ? 'configured' : 'unconfigured'),
      escapeCsv(card.scan_count),
    ]);

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n');

    const filename = `smart-review-cards-${new Date().toISOString().slice(0, 10)}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error exporting cards to CSV:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export cards to CSV' },
      { status: 500 }
    );
  }
}

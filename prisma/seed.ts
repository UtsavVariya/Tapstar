import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.cardEvent.deleteMany();
  await prisma.card.deleteMany();

  const sampleCards = [
    {
      card_code: 'CARD1001',
      username: 'royal_salon',
      password: 'royal2024',
      is_configured: true,
      shop_name: 'Royal Men\'s Salon',
      business_category: 'Salon',
      keywords: 'haircut, beard trim, grooming, styling, best barber',
      google_review_url: 'https://search.google.com/local/writereview?placeid=EXAMPLE1',
      whatsapp_url: 'https://wa.me/919876543210',
      instagram_url: 'https://instagram.com/royalmensalon',
      scan_count: 47,
      review_clicks: 23,
      whatsapp_clicks: 15,
      instagram_clicks: 9,
    },
    {
      card_code: 'CARD1002',
      username: 'urban_cafe',
      password: 'urban2024',
      is_configured: true,
      shop_name: 'Urban Cafe & Bistro',
      business_category: 'Restaurant',
      keywords: 'coffee, pasta, breakfast, cozy ambiance, best cafe',
      google_review_url: 'https://search.google.com/local/writereview?placeid=EXAMPLE2',
      whatsapp_url: 'https://wa.me/919876543211',
      instagram_url: 'https://instagram.com/urbancafe',
      scan_count: 32,
      review_clicks: 18,
      whatsapp_clicks: 8,
      instagram_clicks: 6,
    },
    {
      card_code: 'CARD1003',
      username: 'trendy_fashion',
      password: 'trendy2024',
      is_configured: true,
      shop_name: 'Trendy Fashion Hub',
      business_category: 'Clothing Store',
      keywords: 'clothes, fashion, trendy outfits, affordable, branded',
      google_review_url: 'https://search.google.com/local/writereview?placeid=EXAMPLE3',
      whatsapp_url: 'https://wa.me/919876543212',
      instagram_url: 'https://instagram.com/trendyfashionhub',
      scan_count: 19,
      review_clicks: 11,
      whatsapp_clicks: 5,
      instagram_clicks: 3,
    },
    {
      card_code: 'CARD1004',
      username: 'dr_sharma',
      password: 'clinic2024',
      is_configured: false,
      shop_name: null,
      business_category: null,
      keywords: null,
      google_review_url: null,
      whatsapp_url: null,
      instagram_url: null,
      scan_count: 0,
      review_clicks: 0,
      whatsapp_clicks: 0,
      instagram_clicks: 0,
    },
    {
      card_code: 'CARD1005',
      username: 'quick_electronics',
      password: 'quick2024',
      is_configured: false,
      shop_name: null,
      business_category: null,
      keywords: null,
      google_review_url: null,
      whatsapp_url: null,
      instagram_url: null,
      scan_count: 0,
      review_clicks: 0,
      whatsapp_clicks: 0,
      instagram_clicks: 0,
    },
  ];

  for (const card of sampleCards) {
    const { password, ...cardData } = card;
    const password_hash = await bcrypt.hash(password, 10);

    await prisma.card.create({
      data: {
        ...cardData,
        password_hash,
      },
    });

    console.log(`  ✅ Created card ${card.card_code} (user: ${card.username}, pass: ${password})`);
  }

  // Add some sample events for configured cards
  const card1 = await prisma.card.findUnique({ where: { card_code: 'CARD1001' } });
  if (card1) {
    const eventTypes = ['scan', 'review_click', 'whatsapp_click', 'instagram_click'];
    for (let i = 0; i < 20; i++) {
      await prisma.cardEvent.create({
        data: {
          card_id: card1.id,
          event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // random within last 30 days
        },
      });
    }
    console.log('  ✅ Created sample events for CARD1001');
  }

  console.log('\n🎉 Seeding complete!');
  console.log('\n📋 Sample Card Credentials:');
  console.log('  CARD1001 → royal_salon / royal2024 (configured)');
  console.log('  CARD1002 → urban_cafe / urban2024 (configured)');
  console.log('  CARD1003 → trendy_fashion / trendy2024 (configured)');
  console.log('  CARD1004 → dr_sharma / clinic2024 (unclaimed)');
  console.log('  CARD1005 → quick_electronics / quick2024 (unclaimed)');
  console.log('\n🔑 Admin: admin / admin123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

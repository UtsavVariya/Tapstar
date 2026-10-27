// Rich category-specific fallback templates for when no AI API key is configured.
// These generate natural-sounding 5-star reviews per business category.

interface ReviewTemplate {
  patterns: string[];
}

const categoryTemplates: Record<string, ReviewTemplate> = {
  salon: {
    patterns: [
      'Amazing experience at {shop}! The haircut was exactly what I wanted. Highly skilled staff and great attention to detail. Will definitely come back!',
      'Best {category} in town! The team at {shop} is so friendly and professional. Quick service and the result was perfect. Love this place!',
      '{shop} never disappoints! Top-notch grooming services every single time. The ambiance is fantastic and prices are very reasonable.',
      'Had the best styling session at {shop}. The staff really knows their craft. Super clean, welcoming vibe, and amazing results. 10/10 recommend!',
      'Went to {shop} for the first time and I\'m impressed! Excellent {category} service with attention to every detail. My go-to spot now!',
      'The team at {shop} is incredibly talented. Got compliments on my new look all day! Best {category} experience I\'ve ever had.',
    ],
  },
  restaurant: {
    patterns: [
      'Absolutely loved the food at {shop}! Every dish was fresh and flavorful. The ambiance is cozy and the staff is super welcoming. Must visit!',
      '{shop} is hands down the best {category} nearby. Delicious menu, quick service, and great portions. Perfect for family dinners and date nights!',
      'Can\'t get enough of {shop}! The {keywords} here are out of this world. Great value for money and the service is always on point.',
      'Amazing dining experience at {shop}. The food is consistently delicious, the staff is courteous, and the prices are very fair. Highly recommend!',
      '{shop} has become our favorite spot! Whether it\'s breakfast or dinner, the quality never drops. Love their {keywords}. A gem!',
      'First time at {shop} and already planning my next visit! The flavors are incredible and the portion sizes are generous. Must try!',
    ],
  },
  'clothing store': {
    patterns: [
      'Great collection at {shop}! Found exactly what I was looking for. Trendy styles at affordable prices. The staff was super helpful too!',
      '{shop} is my go-to for {keywords}. Amazing quality, latest trends, and the prices are unbeatable. Always leave happy with my purchases!',
      'Love shopping at {shop}! Their collection is always fresh and stylish. The staff helps you find the perfect outfit. Highly recommended!',
      'Best {category} in the area! {shop} has an incredible selection of {keywords}. Great quality and the fitting rooms are spacious and clean.',
      '{shop} never fails to impress with their trendy collection. Fair pricing, friendly service, and always something new to discover!',
      'Visited {shop} looking for something specific and found even more! Their range of {keywords} is impressive. Will definitely return!',
    ],
  },
  electronics: {
    patterns: [
      '{shop} has the best deals on electronics! Great range of products, genuine items, and the staff is very knowledgeable. Highly recommend!',
      'Bought my new gadget from {shop} and the experience was seamless. Competitive prices, expert advice, and great after-sales support!',
      'Amazing {category} store! {shop} offers genuine products at fair prices. The staff is helpful without being pushy. My trusted tech shop!',
      '{shop} is the best place for {keywords}. Excellent variety, honest pricing, and the team really knows their stuff. Always my first choice!',
      'Great service at {shop}! They helped me choose the perfect product within my budget. Reliable store with authentic {keywords}. Love it!',
      'Impressed with {shop}! Wide selection, competitive prices, and they actually care about customer satisfaction. Best {category} shop around!',
    ],
  },
  clinic: {
    patterns: [
      'Excellent care at {shop}! The doctor is very thorough and the staff is warm and professional. Clean facility and minimal wait times. Highly recommend!',
      '{shop} provides top-quality healthcare. The doctor listens carefully and explains everything clearly. Very comfortable and trustworthy experience.',
      'Best {category} experience! {shop} has a wonderful team. They make you feel at ease and provide excellent treatment. Highly recommended!',
      'I trust {shop} completely with my health. Professional staff, clean environment, and the doctor is truly knowledgeable. Worth every visit!',
      '{shop} stands out for their patient care. Short waiting times, friendly reception, and the doctor is incredibly attentive. Five stars!',
      'Had a great experience at {shop}. The facilities are modern and clean, and the medical advice was thorough and helpful. Definitely coming back!',
    ],
  },
  gym: {
    patterns: [
      '{shop} is the best gym in town! Great equipment, clean facilities, and the trainers are motivating and professional. Love working out here!',
      'Amazing fitness center! {shop} has everything you need — modern machines, group classes, and a supportive community. Highly recommended!',
      'Joined {shop} recently and it\'s been life-changing. The trainers create personalized plans and the vibe is incredibly motivating!',
      '{shop} offers excellent value for money. Top-notch equipment, spotless facilities, and the staff genuinely cares about your progress!',
      'Best decision I made was joining {shop}. Great atmosphere, knowledgeable trainers, and the results speak for themselves. 5 stars!',
      'Love the energy at {shop}! Whether you\'re a beginner or advanced, the trainers make sure you get the most out of every session.',
    ],
  },
  default: {
    patterns: [
      'Wonderful experience at {shop}! The team is professional, friendly, and truly cares about their customers. Highly recommend their {category} services!',
      '{shop} exceeded my expectations! Great quality, fair pricing, and the staff is super helpful. Will definitely visit again and recommend to friends!',
      'Best {category} experience I\'ve had! {shop} delivers excellent service with a personal touch. Clean, welcoming, and worth every penny!',
      'I\'m so glad I found {shop}! Their {keywords} are top-notch and the customer service is outstanding. A truly 5-star experience every time!',
      '{shop} is a hidden gem! Professional team, great results, and they go above and beyond for their customers. Absolutely love this place!',
      'Consistently great experience at {shop}. The quality of {keywords} is unmatched in the area. Friendly staff and great value for money!',
    ],
  },
};

function getRandomSubset<T>(array: T[], count: number): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function fillTemplate(template: string, shopName: string, category: string, keywords: string): string {
  return template
    .replace(/\{shop\}/g, shopName)
    .replace(/\{category\}/g, category.toLowerCase())
    .replace(/\{keywords\}/g, keywords || category.toLowerCase());
}

export function generateFallbackReviews(
  shopName: string,
  businessCategory: string,
  keywords: string
): string[] {
  const categoryKey = businessCategory.toLowerCase();
  const templates = categoryTemplates[categoryKey] || categoryTemplates.default;

  // Pick 4 random reviews from the category's patterns
  const selected = getRandomSubset(templates.patterns, 4);

  // If we don't have 4 unique patterns, supplement from default
  if (selected.length < 4) {
    const defaults = getRandomSubset(categoryTemplates.default.patterns, 4 - selected.length);
    selected.push(...defaults);
  }

  return selected.map((template) => fillTemplate(template, shopName, businessCategory, keywords));
}

// Map common category names to their template keys
export function normalizeCategory(category: string): string {
  const lower = category.toLowerCase().trim();
  const mappings: Record<string, string> = {
    'salon': 'salon',
    'barber': 'salon',
    'beauty parlor': 'salon',
    'spa': 'salon',
    'hair salon': 'salon',
    "men's salon": 'salon',
    'restaurant': 'restaurant',
    'cafe': 'restaurant',
    'bistro': 'restaurant',
    'food': 'restaurant',
    'dhaba': 'restaurant',
    'hotel': 'restaurant',
    'bakery': 'restaurant',
    'clothing': 'clothing store',
    'clothing store': 'clothing store',
    'fashion': 'clothing store',
    'boutique': 'clothing store',
    'garments': 'clothing store',
    'apparel': 'clothing store',
    'electronics': 'electronics',
    'mobile shop': 'electronics',
    'computer shop': 'electronics',
    'gadgets': 'electronics',
    'clinic': 'clinic',
    'hospital': 'clinic',
    'dental': 'clinic',
    'doctor': 'clinic',
    'medical': 'clinic',
    'pharmacy': 'clinic',
    'gym': 'gym',
    'fitness': 'gym',
    'yoga': 'gym',
    'crossfit': 'gym',
  };

  for (const [key, value] of Object.entries(mappings)) {
    if (lower.includes(key)) return value;
  }
  return 'default';
}

// Shared TypeScript types for the application

export interface CardData {
  id: string;
  card_code: string;
  username: string;
  is_configured: boolean;
  shop_name: string | null;
  business_category: string | null;
  keywords: string | null;
  logo_url: string | null;
  google_review_url: string | null;
  whatsapp_url: string | null;
  instagram_url: string | null;
  cached_reviews: string | null;
  expires_at: string | null;
  scan_count: number;
  review_clicks: number;
  whatsapp_clicks: number;
  instagram_clicks: number;
  created_at: string;
  updated_at: string;
}

export interface CardWithPassword extends CardData {
  password_hash: string;
}

export interface AdminCardView extends CardData {
  password_plain?: string; // Only available during bulk generation
  full_url: string;
}

export interface CardEvent {
  id: string;
  card_id: string;
  event_type: 'scan' | 'review_click' | 'whatsapp_click' | 'instagram_click';
  user_agent: string | null;
  created_at: string;
}

export interface SetupFormData {
  shop_name: string;
  business_category: string;
  keywords: string;
  google_review_url: string;
  whatsapp_url: string;
  instagram_url: string;
}

export interface LoginFormData {
  username: string;
  password: string;
}

export interface BulkGenerateRequest {
  count: number;
  prefix?: string;
}

export interface BulkGenerateResult {
  cards: {
    card_code: string;
    username: string;
    password: string;
    full_url: string;
  }[];
}

export interface ReviewGenerateRequest {
  card_code: string;
}

export interface ReviewGenerateResponse {
  reviews: string[];
  source: 'ai' | 'template';
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TrackEventRequest {
  card_code: string;
  event_type: 'scan' | 'review_click' | 'whatsapp_click' | 'instagram_click';
}

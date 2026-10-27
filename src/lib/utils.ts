import { type ClassValue, clsx } from 'clsx';

// Simple clsx implementation (no external dep needed)
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

// Format WhatsApp number to URL
export function formatWhatsAppUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('https://wa.me/') || trimmed.startsWith('http://wa.me/')) {
    return trimmed;
  }
  // Remove spaces, dashes, and non-digit chars (except leading +)
  const cleaned = trimmed.replace(/[^\d+]/g, '');
  const number = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;
  return `https://wa.me/${number}`;
}

// Format Instagram handle to URL
export function formatInstagramUrl(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith('https://instagram.com/') || trimmed.startsWith('https://www.instagram.com/')) {
    return trimmed;
  }
  const handle = trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
  return `https://instagram.com/${handle}`;
}

// Validate Google Review URL
export function isValidGoogleReviewUrl(url: string): boolean {
  const patterns = [
    /^https?:\/\/(www\.)?google\..+\/maps/,
    /^https?:\/\/maps\.google\./,
    /^https?:\/\/g\.page\//,
    /^https?:\/\/search\.google\..+\/local\/writereview/,
    /^https?:\/\/maps\.app\.goo\.gl\//,
  ];
  return patterns.some((p) => p.test(url.trim()));
}

// Generate a random card code
export function generateCardCode(prefix: string = 'CARD', length: number = 4): string {
  const num = Math.floor(Math.random() * Math.pow(10, length));
  return `${prefix}${num.toString().padStart(length, '0')}`;
}

// Generate a readable username from a number
export function generateUsername(index: number): string {
  return `user_${index.toString().padStart(4, '0')}`;
}

// Generate a random password
export function generatePassword(length: number = 8): string {
  const chars = 'abcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Format date for display
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Get full card URL
export function getCardUrl(cardCode: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return `${baseUrl}/c/${cardCode}`;
}

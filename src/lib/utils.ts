import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS classes with proper conflict resolution.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format an integer amount in cents to a localized currency string.
 * All monetary values are stored as cents (integers) to avoid floating-point issues.
 *
 * @example formatCents(350) => "€ 3,50"
 * @example formatCents(1299, 'fr-FR') => "12,99 €"
 */
export function formatCents(cents: number, locale: string = 'it-IT'): string {
  const amount = cents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format an ISO date string to a localized date string.
 *
 * @example formatDate('2024-03-15T10:30:00Z', 'it') => "15 marzo 2024"
 */
export function formatDate(date: string, locale: string): string {
  const localeMap: Record<string, string> = {
    it: 'it-IT',
    fr: 'fr-FR',
  };
  return new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format an ISO date string to a localized time string.
 *
 * @example formatTime('2024-03-15T10:30:00Z', 'it') => "10:30"
 */
export function formatTime(date: string, locale: string): string {
  const localeMap: Record<string, string> = {
    it: 'it-IT',
    fr: 'fr-FR',
  };
  return new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Format a date as a relative time string (e.g., "5 min fa", "il y a 5 min").
 * Falls back to absolute date for durations longer than 24 hours.
 */
export function formatRelativeTime(date: string, locale: string = 'it'): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const localeMap: Record<string, string> = {
    it: 'it-IT',
    fr: 'fr-FR',
  };

  const rtf = new Intl.RelativeTimeFormat(localeMap[locale] ?? locale, {
    numeric: 'auto',
  });

  if (diffSeconds < 60) {
    return rtf.format(-diffSeconds, 'second');
  }
  if (diffMinutes < 60) {
    return rtf.format(-diffMinutes, 'minute');
  }
  if (diffHours < 24) {
    return rtf.format(-diffHours, 'hour');
  }
  if (diffDays < 30) {
    return rtf.format(-diffDays, 'day');
  }

  // Fall back to absolute date for older dates
  return formatDate(date, locale);
}

/**
 * Generate a UUID v4 idempotency key.
 * Uses the Web Crypto API for secure random generation.
 */
export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

/**
 * Calculate the total amount for an order from its line items.
 * All values are in cents (integers) to avoid floating-point precision issues.
 *
 * @example calculateOrderTotal([{ quantity: 2, unit_price_cents: 350 }]) => 700
 */
export function calculateOrderTotal(
  items: { quantity: number; unit_price_cents: number }[]
): number {
  return items.reduce((total, item) => {
    return total + Math.round(item.quantity * item.unit_price_cents);
  }, 0);
}

/**
 * Extract initials from a full name.
 *
 * @example getInitials("Mario Rossi") => "MR"
 * @example getInitials("Jean-Pierre") => "J"
 */
export function getInitials(name: string): string {
  if (!name || name.trim().length === 0) return '';

  return name
    .trim()
    .split(/\s+/)
    .map(part => part.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

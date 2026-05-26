import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatXAF(amount: number): string {
  if (isNaN(amount)) return '0 XAF';
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1).replace('.0', '')}M XAF`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}k XAF`;
  return `${amount.toLocaleString()} XAF`;
}

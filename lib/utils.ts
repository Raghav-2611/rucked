import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, isToday, isYesterday, isThisYear, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatStatementTimestamp(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    const timeFormatted = format(date, 'h:mm a');

    if (isToday(date)) {
      return `${timeFormatted} • Today`;
    }
    if (isYesterday(date)) {
      return `${timeFormatted} • Yesterday`;
    }
    if (isThisYear(date)) {
      return `${timeFormatted} • ${format(date, 'd MMM')}`;
    }
    return `${timeFormatted} • ${format(date, 'd MMM yyyy')}`;
  } catch {
    return dateStr;
  }
}

export function formatTopicTimestamp(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    if (isThisYear(date)) {
      return format(date, 'd MMM');
    }
    return format(date, 'd/MM/yyyy');
  } catch {
    return dateStr;
  }
}

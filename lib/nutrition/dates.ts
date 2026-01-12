/**
 * Formats a Date object into ISO date string (YYYY-MM-DD)
 */
export const formatISODate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Example: "2025-01-01T12:45:00Z" → "12:45 PM"
export const formatTimeFromISO = (isoString: string): string => {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

// Example: "Monday, January 15, 2025"
export const formatFullDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * - Today → "Today"
 * - Yesterday → "Yesterday"
 * - Otherwise → "Jan 15" or "Jan 15, 2024" if year differs
 */
export const formatRelativeDate = (date: Date): string => {
  const today = new Date();
  const yesterday = new Date();

  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  }

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  });
};

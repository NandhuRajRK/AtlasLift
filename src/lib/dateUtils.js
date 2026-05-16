import { format, subDays, startOfDay } from 'date-fns';

export function getToday() {
  return format(new Date(), 'yyyy-MM-dd');
}

export function formatDate(date) {
  return format(new Date(date), 'MMM d, yyyy');
}

export function formatShortDate(date) {
  return format(new Date(date), 'MMM d');
}

export function getDaysAgo(days) {
  return format(subDays(new Date(), days), 'yyyy-MM-dd');
}

export function getDateRange(days) {
  const dates = [];
  for (let i = days - 1; i >= 0; i--) {
    dates.push(format(subDays(new Date(), i), 'yyyy-MM-dd'));
  }
  return dates;
}
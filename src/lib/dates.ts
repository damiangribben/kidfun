/** Parses a 'YYYY-MM-DD' database date as a local date (no timezone shift). */
export function parseDate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a local date as 'YYYY-MM-DD' for the database. */
export function toDateString(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Whole months between a birth date and today. */
export function ageInMonths(birthDate: Date, today = new Date()): number {
  let months =
    (today.getFullYear() - birthDate.getFullYear()) * 12 +
    (today.getMonth() - birthDate.getMonth());
  if (today.getDate() < birthDate.getDate()) months -= 1;
  return Math.max(0, months);
}

/** "8 months", "2 years 6 months", "5 years". */
export function ageLabel(birthDate: Date, today = new Date()): string {
  const months = ageInMonths(birthDate, today);
  const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
  if (months < 1) return 'Newborn';
  if (months < 24) return plural(months, 'month');
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return rest === 0 ? plural(years, 'year') : `${plural(years, 'year')} ${plural(rest, 'month')}`;
}

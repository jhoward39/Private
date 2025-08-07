/**
 * Parses a date string in "YYYY-MM-DD" format and returns a Date object.
 * Appends "T00:00:00" to ensure the date is parsed in the local timezone.
 * @param dateStr The date string to parse.
 * @returns A Date object representing the parsed date.
 */
export function parseDate(dateStr: string): Date {
  return new Date(dateStr + "T00:00:00");
}

/**
 * Formats a Date object into a "YYYY-MM-DD" string.
 * Uses local timezone components to prevent off-by-one day errors.
 * @param date The Date object to format.
 * @returns A formatted date string.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Adds a specified number of days to a given date.
 * @param date The starting date.
 * @param days The number of days to add.
 * @returns A new Date object representing the resulting date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}




export function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export function currentMonth(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

export function previousMonth(month: string): string {
  const [yearRaw, monthRaw] = month.split("-");
  const date = new Date(Number(yearRaw), Number(monthRaw) - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return currentMonth(date);
}

export function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${date.getFullYear()}/${pad2(date.getMonth() + 1)}/${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
}

export function todayDateString(date = new Date()): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

export function monthToParts(value: string): { year: string; month: string } {
  const [year, month] = value.split("-");
  return { year, month };
}

export function buildYearOptions(
  current = new Date().getFullYear(),
  extraYears: string[] = [],
  span = 5
): Array<{ label: string; value: string }> {
  const years = new Set<string>(extraYears);

  for (let year = current - span; year <= current + span; year += 1) {
    years.add(String(year));
  }

  return [...years]
    .sort((left, right) => Number(right) - Number(left))
    .map((year) => ({ label: String(year), value: String(year) }));
}

export function buildMonthOptions(labels?: string[]): Array<{ label: string; value: string }> {
  return Array.from({ length: 12 }, (_, index) => {
    const month = pad2(index + 1);
    const label = labels?.[index] ?? `${month}月`;
    return { label, value: month };
  });
}

export function isMonthString(value: string): boolean {
  return /^\d{4}-\d{2}$/.test(value);
}

export function isDateString(value: string | null | undefined): boolean {
  if (!value) {
    return true;
  }
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

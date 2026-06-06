export function todayDateString(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function eventsForDate<T extends { date: string }>(
  events: T[],
  date: string,
): T[] {
  return events.filter((e) => e.date === date);
}

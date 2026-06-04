/**
 * User-facing role labels. Internal enums/API values stay unchanged (e.g. "GA").
 */

const SHORT: Record<string, string> = {
  GA: "AD",
};

const LONG: Record<string, string> = {
  GA: "Area Director",
  SA: "Student Assistant",
};

/** Short label for badges, filters, compact UI (e.g. AD) */
export function roleLabelShort(role: string): string {
  return SHORT[role] ?? role;
}

/** Long label for titles, empty states, descriptions */
export function roleLabelLong(role: string): string {
  return LONG[role] ?? role;
}

/** Select option: "AD — Area Director" while value remains GA */
export function roleLabelOption(role: string): string {
  if (role === "GA") return "AD — Area Director";
  return role;
}

/** Stat line segment: "3 AD" using internal count key */
export function roleStatLine(
  counts: { RA?: number; GA?: number; SA?: number; Admin?: number },
): string {
  const parts: string[] = [];
  if (counts.RA != null) parts.push(`${counts.RA} RA`);
  if (counts.GA != null) parts.push(`${counts.GA} ${roleLabelShort("GA")}`);
  if (counts.SA != null) parts.push(`${counts.SA} SA`);
  return parts.join(" · ");
}

function parseDateInput(date: string): Date {
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (dateOnly) {
    return new Date(
      Number(dateOnly[1]),
      Number(dateOnly[2]) - 1,
      Number(dateOnly[3]),
    );
  }
  return new Date(date);
}

export function formatDate(date: string) {
  return parseDateInput(date).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(time?: string) {
  if (!time) return null
  const [hours, minutes] = time.split(':')
  const date = new Date()
  date.setHours(parseInt(hours), parseInt(minutes))
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

export function formatUserAssignment(
  assignment?: string[] | string,
  community?: string[] | string,
): string {
  const sections = Array.isArray(assignment)
    ? assignment.filter(Boolean)
    : assignment
      ? [assignment]
      : [];
  const communityName = Array.isArray(community)
    ? community.filter(Boolean)[0]
    : community;

  if (sections.length === 0 && !communityName) return "";
  if (sections.length === 0) return communityName ?? "";

  const sectionLabel =
    sections.length === 1 ? sections[0] : sections.join(", ");

  return communityName
    ? `${sectionLabel} · ${communityName}`
    : sectionLabel;
}
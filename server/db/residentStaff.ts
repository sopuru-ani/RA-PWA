import type { SectionStaffLean } from "./sectionStaff.model.js";
import type { ResidentLean } from "./resident.model.js";

export type StaffEmails = { raEmail: string; gaEmail: string };

export function staffKey(community: string, section: string): string {
  return `${community}__${section}`;
}

export function buildStaffMap(
  staffRecords: Pick<SectionStaffLean, "community" | "section" | "raEmail" | "gaEmail">[],
): Map<string, StaffEmails> {
  return new Map(
    staffRecords.map((s) => [
      staffKey(s.community, s.section),
      { raEmail: s.raEmail, gaEmail: s.gaEmail },
    ]),
  );
}

/** Resident with RA/GA emails joined from SectionStaff (not stored on Resident). */
export type ResidentWithStaff = ResidentLean & StaffEmails;

export function attachStaffToResidents(
  residents: ResidentLean[],
  staffMap: Map<string, StaffEmails>,
): ResidentWithStaff[] {
  return residents.map((resident) => {
    const staff = staffMap.get(staffKey(resident.community, resident.section));
    return {
      ...resident,
      raEmail: staff?.raEmail ?? "",
      gaEmail: staff?.gaEmail ?? "",
    } as ResidentWithStaff;
  });
}

/** Drop staff email fields from import payloads before insert. */
export function omitStaffFields<T extends Record<string, unknown>>(row: T): Omit<T, "raEmail" | "gaEmail"> {
  const { raEmail: _ra, gaEmail: _ga, ...rest } = row;
  return rest;
}

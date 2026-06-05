import type ExcelJS from "exceljs";

export type ResidentImportRow = {
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  community: string;
  section: string;
  room: string;
  notes?: string;
};

export type RowWithMeta = {
  data: ResidentImportRow;
  missingFields: string[];
  rawIndex: number;
};

export const FIELD_ALIASES: Record<string, keyof ResidentImportRow> = {
  firstname: "firstName",
  "first name": "firstName",
  first_name: "firstName",
  fname: "firstName",
  given: "firstName",
  "given name": "firstName",
  lastname: "lastName",
  "last name": "lastName",
  last_name: "lastName",
  lname: "lastName",
  surname: "lastName",
  "family name": "lastName",
  familyname: "lastName",
  fullname: "fullName",
  "full name": "fullName",
  full_name: "fullName",
  name: "fullName",
  email: "email",
  "email address": "email",
  emailaddress: "email",
  "e-mail": "email",
  "e-mail address": "email",
  "student email": "email",
  studentemail: "email",
  studentid: "studentId",
  "student id": "studentId",
  student_id: "studentId",
  sid: "studentId",
  "student number": "studentId",
  studentnumber: "studentId",
  id: "studentId",
  "id number": "studentId",
  idnumber: "studentId",
  uid: "studentId",
  community: "community",
  hall: "community",
  building: "community",
  dorm: "community",
  "residence hall": "community",
  residencehall: "community",
  residence: "community",
  section: "section",
  floor: "section",
  wing: "section",
  area: "section",
  zone: "section",
  room: "room",
  "room number": "room",
  roomnumber: "room",
  room_number: "room",
  "room no": "room",
  roomno: "room",
  unit: "room",
  notes: "notes",
  note: "notes",
  comments: "notes",
  comment: "notes",
  remarks: "notes",
};

export const REQUIRED_FIELDS: (keyof ResidentImportRow)[] = [
  "firstName",
  "lastName",
  "email",
  "studentId",
  "community",
  "section",
  "room",
];

export const DB_FIELDS: (keyof ResidentImportRow)[] = [
  "firstName",
  "lastName",
  "fullName",
  "email",
  "studentId",
  "community",
  "section",
  "room",
  "notes",
];

export const FIELD_LABELS: Record<keyof ResidentImportRow, string> = {
  firstName: "First Name",
  lastName: "Last Name",
  fullName: "Full Name",
  email: "Email",
  studentId: "Student ID",
  community: "Community",
  section: "Section",
  room: "Room",
  notes: "Notes",
};

export function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

export function mapHeaders(
  headers: string[],
): Record<number, keyof ResidentImportRow> {
  const mapping: Record<number, keyof ResidentImportRow> = {};
  headers.forEach((h, i) => {
    const field = FIELD_ALIASES[normalizeHeader(h)];
    if (field) mapping[i] = field;
  });
  return mapping;
}

export function getRequiredFields(
  lockedCommunity?: string,
): (keyof ResidentImportRow)[] {
  return lockedCommunity
    ? REQUIRED_FIELDS.filter((f) => f !== "community")
    : REQUIRED_FIELDS;
}

export function getUnmappedHeaders(headers: string[]): string[] {
  return headers.filter((h) => h.trim() !== "" && !FIELD_ALIASES[normalizeHeader(h)]);
}

export function getMissingRequiredColumns(
  headers: string[],
  lockedCommunity?: string,
): (keyof ResidentImportRow)[] {
  const colMap = mapHeaders(headers);
  const mappedFields = new Set(Object.values(colMap));
  return getRequiredFields(lockedCommunity).filter((f) => !mappedFields.has(f));
}

export function parseResidentRows(
  headers: string[],
  rows: string[][],
  lockedCommunity?: string,
): RowWithMeta[] {
  const colMap = mapHeaders(headers);
  const required = getRequiredFields(lockedCommunity);
  return rows
    .map((row, rawIndex) => {
      const data: Partial<ResidentImportRow> = {};
      row.forEach((cell, colIndex) => {
        const field = colMap[colIndex];
        if (field) (data as Record<string, string>)[field] = cell?.trim() ?? "";
      });
      if (lockedCommunity) {
        data.community = lockedCommunity;
      }
      if (!data.fullName && (data.firstName || data.lastName)) {
        data.fullName = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
      }
      const missingFields = required.filter(
        (f) => !data[f] || (data[f] as string).trim() === "",
      );
      return {
        data: data as ResidentImportRow,
        missingFields,
        rawIndex: rawIndex + 1,
      };
    })
    .filter((r) =>
      Object.values(r.data).some((v) => v && String(v).trim() !== ""),
    );
}

export function worksheetToRaw(worksheet: ExcelJS.Worksheet): {
  headers: string[];
  rows: string[][];
} {
  let headers: string[] = [];
  const rows: string[][] = [];
  worksheet.eachRow((row, rowNumber) => {
    const rowText: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowText[colNumber - 1] = cell.text ?? "";
    });
    if (rowNumber === 1) headers = rowText;
    else rows.push(rowText);
  });
  return { headers, rows };
}

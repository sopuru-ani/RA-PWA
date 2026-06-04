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
  lastname: "lastName",
  "last name": "lastName",
  last_name: "lastName",
  fullname: "fullName",
  "full name": "fullName",
  name: "fullName",
  email: "email",
  studentid: "studentId",
  "student id": "studentId",
  community: "community",
  section: "section",
  room: "room",
  notes: "notes",
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

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]): Record<number, keyof ResidentImportRow> {
  const mapping: Record<number, keyof ResidentImportRow> = {};
  headers.forEach((h, i) => {
    const field = FIELD_ALIASES[normalizeHeader(h)];
    if (field) mapping[i] = field;
  });
  return mapping;
}

export function parseResidentRows(
  headers: string[],
  rows: string[][],
  lockedCommunity?: string,
): RowWithMeta[] {
  const colMap = mapHeaders(headers);
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
      const required = lockedCommunity
        ? REQUIRED_FIELDS.filter((f) => f !== "community")
        : REQUIRED_FIELDS;
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

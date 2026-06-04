"use client";
import React, { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
import { useNotification } from "@/context/notification-context";
import ExcelJS from "exceljs";
import type { FileRejection, FileWithPath } from "react-dropzone";
import {
  Plus,
  X,
  UploadCloud,
  ArrowLeft,
  RefreshCcw,
  AlertTriangle,
  CheckCircle2,
  Upload,
  Pencil,
} from "lucide-react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

type ResidentRow = {
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

type RowWithMeta = {
  data: ResidentRow;
  missingFields: string[];
  rawIndex: number;
};

// ─────────────────────────────────────────────
// Field alias map
// ─────────────────────────────────────────────

const FIELD_ALIASES: Record<string, keyof ResidentRow> = {
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

// RA/GA emails live on SectionStaff; not stored on residents
const REQUIRED_FIELDS: (keyof ResidentRow)[] = [
  "firstName",
  "lastName",
  "email",
  "studentId",
  "community",
  "section",
  "room",
];

const DB_FIELDS: (keyof ResidentRow)[] = [
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

const FIELD_LABELS: Record<keyof ResidentRow, string> = {
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

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function normalizeHeader(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, " ");
}

function mapHeaders(headers: string[]): Record<number, keyof ResidentRow> {
  const mapping: Record<number, keyof ResidentRow> = {};
  headers.forEach((h, i) => {
    const field = FIELD_ALIASES[normalizeHeader(h)];
    if (field) mapping[i] = field;
  });
  return mapping;
}

function parseRows(headers: string[], rows: string[][]): RowWithMeta[] {
  const colMap = mapHeaders(headers);
  return rows
    .map((row, rawIndex) => {
      const data: Partial<ResidentRow> = {};
      row.forEach((cell, colIndex) => {
        const field = colMap[colIndex];
        if (field) (data as Record<string, string>)[field] = cell?.trim() ?? "";
      });
      if (!data.fullName && (data.firstName || data.lastName)) {
        data.fullName = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim();
      }
      const missingFields = REQUIRED_FIELDS.filter(
        (f) => !data[f] || (data[f] as string).trim() === "",
      );
      return {
        data: data as ResidentRow,
        missingFields,
        rawIndex: rawIndex + 2,
      };
    })
    .filter((r) =>
      Object.values(r.data).some((v) => v && String(v).trim() !== ""),
    );
}

function worksheetToRaw(worksheet: ExcelJS.Worksheet): {
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

// ─────────────────────────────────────────────
// Dropzone Step — original UI
// ─────────────────────────────────────────────

function DropzoneStep({
  onFileLoaded,
}: {
  onFileLoaded: (wb: ExcelJS.Workbook, name: string) => void;
}) {
  const { show } = useNotification();

  const onDrop = useCallback(
    async (acceptedFiles: FileWithPath[]) => {
      if (acceptedFiles.length === 0) return;
      try {
        const file = acceptedFiles[0];
        const buffer = await file.arrayBuffer();
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.load(buffer);
        onFileLoaded(workbook, file.name);
      } catch {
        show({
          msg: "Failed to read workbook. Please upload a valid .xlsx file.",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    },
    [onFileLoaded, show],
  );

  const onDropRejected = useCallback(
    (rejections: FileRejection[]) => {
      show({
        msg: rejections
          .map(
            ({ file, errors }) =>
              `${file.name}: ${errors.map((e) => e.message).join(", ")}`,
          )
          .join(" "),
        type: "error",
        closable: true,
        duration: null,
      });
    },
    [show],
  );

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
  } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
  });

  return (
    <div className="p-4 w-full min-h-dvh flex justify-center items-center">
      <div
        {...getRootProps()}
        className={`w-full max-w-200 h-100 bg-accent rounded-sm p-4 ${isDragActive && "p-0!"} cursor-pointer border-2 border-dashed border-gray-400 dark:border-gray-600`}
      >
        <input {...getInputProps()} />
        {isDragActive ? (
          <div
            className={`w-full h-full flex justify-center items-center ${isDragAccept && "bg-green-300/70"} ${isDragReject && "bg-red-300/70"}`}
          >
            {isDragAccept && <Plus className="w-20 h-20" />}
            {isDragReject && <X className="w-20 h-20" />}
          </div>
        ) : (
          <div className="relative w-full h-full flex flex-col gap-2 justify-center items-center md:text-lg">
            <UploadCloud className="w-10 h-10" />
            <p>Drag and Drop File here</p>
            <p className="font-bold">OR</p>
            <p>Click to browse files</p>
            <p className="absolute bottom-0 left-0 text-gray-400">
              Accepted File Types: xlsx
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Worksheet Picker Step — original UI
// ─────────────────────────────────────────────

function WorksheetPickerStep({
  workbook,
  fileName,
  onSelect,
  onRedo,
}: {
  workbook: ExcelJS.Workbook;
  fileName: string;
  onSelect: (ws: ExcelJS.Worksheet) => void;
  onRedo: () => void;
}) {
  const names = workbook.worksheets.map((ws) => ws.name);

  return (
    <div className="p-4 w-full min-h-dvh flex justify-center items-center">
      <div className="flex flex-col w-full max-w-200 h-100 bg-accent rounded-sm p-4 text-sm md:text-lg border">
        <div className="flex flex-row justify-between gap-2">
          <p className="mt-2 text-wrap">
            File: <strong>{fileName}</strong>
          </p>
          <button
            onClick={onRedo}
            className="flex flex-row gap-1 h-fit justify-center items-center cursor-pointer p-2 transition-all duration-150 hover:bg-primary-hover bg-primary md:rounded-md rounded-full md:px-3 md:py-1"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="md:inline-block hidden">Redo</span>
          </button>
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          <p>Choose a worksheet</p>
          <ScrollArea className="overflow-y-auto flex-1 pr-2">
            <ul>
              {names.map((name, i) => (
                <li
                  key={i}
                  className="cursor-pointer p-2 transition-all duration-100 hover:bg-primary-hover border-b"
                  onClick={() =>
                    onSelect(
                      workbook.worksheets.find((ws) => ws.name === name)!,
                    )
                  }
                >
                  {name}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Inline-editable cell
// ─────────────────────────────────────────────

function EditableCell({
  value,
  isMissing,
  onSave,
}: {
  value: string;
  isMissing: boolean;
  onSave: (v: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = () => {
    setEditing(false);
    onSave(draft.trim());
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full min-w-20 bg-background border border-primary rounded px-1.5 py-0.5 text-sm outline-none focus:ring-1 focus:ring-primary"
      />
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 cursor-pointer rounded px-1 py-0.5 transition-colors ${
        isMissing
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "hover:bg-muted/60"
      }`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title="Click to edit"
    >
      <span className="text-sm">
        {value || <span className="italic opacity-50">empty</span>}
      </span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50 shrink-0 transition-opacity" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Table Step
// ─────────────────────────────────────────────

function TableStep({
  worksheet,
  onBack,
  onRedo,
}: {
  worksheet: ExcelJS.Worksheet;
  onBack: () => void;
  onRedo: () => void;
}) {
  const { headers, rows: rawRows } = worksheetToRaw(worksheet);
  const [parsedRows, setParsedRows] = useState<RowWithMeta[]>(() =>
    parseRows(headers, rawRows),
  );
  const [submitting, setSubmitting] = useState(false);
  const { show } = useNotification();

  const invalidCount = parsedRows.filter(
    (r) => r.missingFields.length > 0,
  ).length;
  const validCount = parsedRows.length - invalidCount;

  const visibleFields = DB_FIELDS.filter((field) =>
    parsedRows.some(
      (r) => r.data[field] && String(r.data[field]).trim() !== "",
    ),
  );
  const displayFields = Array.from(
    new Set([...visibleFields, ...REQUIRED_FIELDS]),
  ) as (keyof ResidentRow)[];

  function updateCell(
    rowIndex: number,
    field: keyof ResidentRow,
    newVal: string,
  ) {
    setParsedRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      row.data = { ...row.data, [field]: newVal };
      if (field === "firstName" || field === "lastName") {
        row.data.fullName =
          `${field === "firstName" ? newVal : row.data.firstName} ${field === "lastName" ? newVal : row.data.lastName}`.trim();
      }
      row.missingFields = REQUIRED_FIELDS.filter(
        (f) => !row.data[f] || String(row.data[f]).trim() === "",
      );
      updated[rowIndex] = row;
      return updated;
    });
  }

  async function handleSubmit() {
    if (invalidCount > 0) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/residents/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedRows.map((r) => r.data)),
      });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();

      const success = json.inserted ?? validCount;
      const failed = json.failed ?? 0;

      if (failed === 0) {
        show({
          msg: `${success} residents added successfully.`,
          type: "success",
          duration: 4000,
        });
      } else {
        show({
          msg: `${success} succeeded, ${failed} failed.`,
          type: "error",
          closable: true,
          duration: null,
        });
      }
    } catch {
      show({
        msg: `Import failed. ${parsedRows.length} row(s) could not be added.`,
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full min-h-dvh flex flex-col p-4 gap-3">
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="p-1.5 rounded-full bg-primary hover:bg-primary-hover transition-all"
            title="Back to worksheet selection"
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={onRedo}
            className="flex flex-row gap-1 h-fit justify-center items-center cursor-pointer p-2 transition-all duration-150 hover:bg-primary-hover bg-primary md:rounded-md rounded-full md:px-3 md:py-1"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="md:inline-block hidden">Redo</span>
          </button>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            {validCount} valid
          </span>
          {invalidCount > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertTriangle className="w-4 h-4" />
              {invalidCount} errors
            </span>
          )}
          <button
            onClick={handleSubmit}
            disabled={invalidCount > 0 || submitting}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              invalidCount > 0 || submitting
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary-hover text-white cursor-pointer"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            {submitting ? "Submitting..." : `Push ${parsedRows.length} rows`}
          </button>
        </div>
      </div>

      {invalidCount > 0 && (
        <div className="bg-red-500/10 border border-red-400/30 rounded-md px-4 py-2 text-sm text-red-600 dark:text-red-400">
          <span className="font-semibold">
            {invalidCount} row(s) have missing required fields.
          </span>{" "}
          Fill in the highlighted cells before pushing to the database.
        </div>
      )}

      <div className="flex-1 bg-accent rounded-sm border overflow-hidden">
        <ScrollArea className="w-full h-full max-h-[calc(100dvh-180px)]">
          <Table className="min-w-fit">
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className="font-semibold w-12 text-center">
                  #
                </TableHead>
                {displayFields.map((field) => (
                  <TableHead
                    key={field}
                    className="font-semibold whitespace-nowrap"
                  >
                    {FIELD_LABELS[field]}
                    {REQUIRED_FIELDS.includes(field) && (
                      <span className="text-red-500 ml-0.5">*</span>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {parsedRows.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={
                    row.missingFields.length > 0
                      ? "bg-red-500/5 hover:bg-red-500/10"
                      : ""
                  }
                >
                  <TableCell className="text-center text-xs text-muted-foreground">
                    {row.rawIndex}
                  </TableCell>
                  {displayFields.map((field) => (
                    <TableCell key={field} className="p-1">
                      <EditableCell
                        value={String(row.data[field] ?? "")}
                        isMissing={row.missingFields.includes(field)}
                        onSave={(val) => updateCell(rowIndex, field, val)}
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      <p className="text-xs text-muted-foreground">
        Click any cell to edit inline. Fields marked with{" "}
        <span className="text-red-500">*</span> are required.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────

type Step = "drop" | "pick" | "table";

export default function ResidentUploadPage() {
  const [step, setStep] = useState<Step>("drop");
  const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
  const [fileName, setFileName] = useState("");
  const [worksheet, setWorksheet] = useState<ExcelJS.Worksheet | null>(null);

  function handleFileLoaded(wb: ExcelJS.Workbook, name: string) {
    setWorkbook(wb);
    setFileName(name);
    setStep("pick");
  }

  function handleWorksheetSelect(ws: ExcelJS.Worksheet) {
    setWorksheet(ws);
    setStep("table");
  }

  function handleRedo() {
    setWorkbook(null);
    setFileName("");
    setWorksheet(null);
    setStep("drop");
  }

  return (
    <div className="w-dvw min-h-dvh">
      {step === "drop" && <DropzoneStep onFileLoaded={handleFileLoaded} />}
      {step === "pick" && workbook && (
        <WorksheetPickerStep
          workbook={workbook}
          fileName={fileName}
          onSelect={handleWorksheetSelect}
          onRedo={handleRedo}
        />
      )}
      {step === "table" && worksheet && (
        <TableStep
          worksheet={worksheet}
          onBack={() => {
            setWorksheet(null);
            setStep("pick");
          }}
          onRedo={handleRedo}
        />
      )}
    </div>
  );
}

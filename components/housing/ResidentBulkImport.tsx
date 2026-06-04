"use client";

import React, { useCallback, useState, useRef } from "react";
import { useDropzone } from "react-dropzone";
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
import { useNotification } from "@/context/notification-context";
import { apiFetch } from "@/lib/api-client";
import {
  type ResidentImportRow,
  type RowWithMeta,
  REQUIRED_FIELDS,
  DB_FIELDS,
  FIELD_LABELS,
  parseResidentRows,
  worksheetToRaw,
} from "@/lib/resident-import";

type Props = {
  lockedCommunity?: string;
  submitPath: string;
  submitButtonLabel?: string;
  successMessage?: (result: {
    created?: number;
    inserted?: number;
    failed?: number;
  }) => string;
};

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

  const commit = () => {
    setEditing(false);
    onSave(draft.trim());
  };

  if (editing) {
    return (
      <input
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
        className="w-full min-w-20 bg-background border border-primary rounded px-1.5 py-0.5 text-sm outline-none"
      />
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 cursor-pointer rounded px-1 py-0.5 ${
        isMissing
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "hover:bg-muted/60"
      }`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
    >
      <span className="text-sm">
        {value || <span className="italic opacity-50">empty</span>}
      </span>
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-50" />
    </div>
  );
}

function DropzoneStep({ onFileLoaded }: { onFileLoaded: (wb: ExcelJS.Workbook, name: string) => void }) {
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
          msg: "Failed to read workbook.",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    },
    [onFileLoaded, show],
  );

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      onDropRejected: (rejections: FileRejection[]) => {
        show({
          msg: rejections.map((r) => r.errors.map((e) => e.message).join(", ")).join(" "),
          type: "error",
          closable: true,
          duration: null,
        });
      },
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      },
      maxFiles: 1,
    });

  return (
    <div className="p-4 w-full min-h-[50dvh] flex justify-center items-center">
      <div
        {...getRootProps()}
        className="w-full max-w-200 h-100 bg-accent rounded-sm p-4 cursor-pointer border-2 border-dashed"
      >
        <input {...getInputProps()} />
        <div className="flex flex-col gap-2 justify-center items-center h-full">
          <UploadCloud className="w-10 h-10" />
          <p>Drag and drop .xlsx file</p>
          {isDragActive && isDragAccept && <Plus className="w-12 h-12" />}
          {isDragReject && <X className="w-12 h-12" />}
        </div>
      </div>
    </div>
  );
}

function TableStep({
  worksheet,
  lockedCommunity,
  submitPath,
  submitButtonLabel = "Submit",
  successMessage,
  onBack,
  onRedo,
}: {
  worksheet: ExcelJS.Worksheet;
  lockedCommunity?: string;
  submitPath: string;
  submitButtonLabel?: string;
  successMessage?: Props["successMessage"];
  onBack: () => void;
  onRedo: () => void;
}) {
  const { headers, rows: rawRows } = worksheetToRaw(worksheet);
  const requiredFields = lockedCommunity
    ? REQUIRED_FIELDS.filter((f) => f !== "community")
    : REQUIRED_FIELDS;

  const [parsedRows, setParsedRows] = useState<RowWithMeta[]>(() =>
    parseResidentRows(headers, rawRows, lockedCommunity),
  );
  const [submitting, setSubmitting] = useState(false);
  const { show } = useNotification();

  const invalidCount = parsedRows.filter((r) => r.missingFields.length > 0).length;
  const validCount = parsedRows.length - invalidCount;

  const displayFields = Array.from(
    new Set([
      ...DB_FIELDS.filter((field) =>
        field === "community" && lockedCommunity
          ? false
          : parsedRows.some((r) => r.data[field]),
      ),
      ...requiredFields,
    ]),
  ) as (keyof ResidentImportRow)[];

  function updateCell(rowIndex: number, field: keyof ResidentImportRow, newVal: string) {
    setParsedRows((prev) => {
      const updated = [...prev];
      const row = { ...updated[rowIndex] };
      row.data = { ...row.data, [field]: newVal };
      if (lockedCommunity) row.data.community = lockedCommunity;
      if (field === "firstName" || field === "lastName") {
        row.data.fullName =
          `${row.data.firstName} ${row.data.lastName}`.trim();
      }
      row.missingFields = requiredFields.filter(
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
      const res = await apiFetch(submitPath, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsedRows.map((r) => r.data)),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.msg ?? "Request failed");

      const msg = successMessage
        ? successMessage(json)
        : `${json.created ?? json.inserted ?? validCount} row(s) processed.`;

      show({ msg, type: "success", duration: 4000 });
    } catch (err) {
      show({
        msg: err instanceof Error ? err.message : "Import failed",
        type: "error",
        closable: true,
        duration: null,
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full flex flex-col gap-3 min-h-[60dvh]">
      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <button type="button" onClick={onBack} className="p-1.5 rounded-full bg-primary">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          <button type="button" onClick={onRedo} className="p-2 bg-primary rounded-md text-white text-sm">
            <RefreshCcw className="w-4 h-4 inline" /> Redo
          </button>
        </div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={invalidCount > 0 || submitting}
          className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-white text-sm disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" />
          {submitting ? "Submitting..." : `${submitButtonLabel} (${parsedRows.length})`}
        </button>
      </div>

      {invalidCount > 0 && (
        <p className="text-sm text-red-600">
          {invalidCount} row(s) have missing required fields.
        </p>
      )}

      <ScrollArea className="flex-1 border rounded-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              {displayFields.map((field) => (
                <TableHead key={field}>{FIELD_LABELS[field]}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {parsedRows.map((row, rowIndex) => (
              <TableRow key={rowIndex}>
                <TableCell>{row.rawIndex}</TableCell>
                {displayFields.map((field) => (
                  <TableCell key={field}>
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
  );
}

export default function ResidentBulkImport({
  lockedCommunity,
  submitPath,
  submitButtonLabel,
  successMessage,
}: Props) {
  const [step, setStep] = useState<"drop" | "pick" | "table">("drop");
  const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
  const [fileName, setFileName] = useState("");
  const [worksheet, setWorksheet] = useState<ExcelJS.Worksheet | null>(null);

  return (
    <div className="pb-4">
      {step === "drop" && (
        <DropzoneStep
          onFileLoaded={(wb, name) => {
            setWorkbook(wb);
            setFileName(name);
            setStep("pick");
          }}
        />
      )}
      {step === "pick" && workbook && (
        <div className="p-4 space-y-2">
          <p className="text-sm">
            File: <strong>{fileName}</strong>
          </p>
          <ul className="space-y-1">
            {workbook.worksheets.map((ws) => (
              <li
                key={ws.name}
                className="cursor-pointer p-2 border-b hover:bg-muted"
                onClick={() => {
                  setWorksheet(ws);
                  setStep("table");
                }}
              >
                {ws.name}
              </li>
            ))}
          </ul>
        </div>
      )}
      {step === "table" && worksheet && (
        <TableStep
          worksheet={worksheet}
          lockedCommunity={lockedCommunity}
          submitPath={submitPath}
          submitButtonLabel={submitButtonLabel}
          successMessage={successMessage}
          onBack={() => setStep("pick")}
          onRedo={() => {
            setWorkbook(null);
            setWorksheet(null);
            setStep("drop");
          }}
        />
      )}
    </div>
  );
}

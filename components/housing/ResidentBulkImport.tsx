"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useRouter } from "next/navigation";
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
import ImportStepIndicator from "@/components/housing/ImportStepIndicator";
import { apiFetch } from "@/lib/api-client";
import {
  type ResidentImportRow,
  type RowWithMeta,
  REQUIRED_FIELDS,
  DB_FIELDS,
  FIELD_LABELS,
  parseResidentRows,
  worksheetToRaw,
  getRequiredFields,
  getUnmappedHeaders,
  getMissingRequiredColumns,
} from "@/lib/resident-import";

export type ImportSubmitResult = {
  created?: number;
  inserted?: number;
  failed?: number | { index: number; message: string }[];
  errors?: { index: number; message: string }[];
  msg?: string;
};

type Props = {
  lockedCommunity?: string;
  submitPath: string;
  submitButtonLabel?: string;
  variant?: "default" | "polished";
  showAuthGate?: boolean;
  successMessage?: (result: ImportSubmitResult) => string;
};

function formatSubmitFailures(result: ImportSubmitResult): string | null {
  const failures = Array.isArray(result.failed)
    ? result.failed
    : result.errors;
  if (!failures?.length) return null;
  const preview = failures
    .slice(0, 3)
    .map((f) => `row ${f.index + 1}: ${f.message}`)
    .join("; ");
  const extra =
    failures.length > 3 ? ` (+${failures.length - 3} more)` : "";
  return preview + extra;
}

function EditableCell({
  value,
  isMissing,
  onSave,
  polished,
}: {
  value: string;
  isMissing: boolean;
  onSave: (v: string) => void;
  polished?: boolean;
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
        className={`w-full min-w-20 bg-background border border-primary rounded px-1.5 py-0.5 text-sm outline-none ${
          polished ? "focus:ring-1 focus:ring-primary" : ""
        }`}
      />
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 cursor-pointer rounded px-1 py-0.5 ${
        polished ? "transition-colors" : ""
      } ${
        isMissing
          ? "bg-red-500/15 text-red-600 dark:text-red-400"
          : "hover:bg-muted/60"
      }`}
      onClick={() => {
        setDraft(value);
        setEditing(true);
      }}
      title={polished ? "Click to edit" : undefined}
    >
      <span className="text-sm">
        {value || <span className="italic opacity-50">empty</span>}
      </span>
      <Pencil
        className={`w-3 h-3 opacity-0 group-hover:opacity-50 ${
          polished ? "shrink-0 transition-opacity" : ""
        }`}
      />
    </div>
  );
}

function DropzoneStep({
  onFileLoaded,
  polished,
  showAuthGate,
}: {
  onFileLoaded: (wb: ExcelJS.Workbook, name: string) => void;
  polished?: boolean;
  showAuthGate?: boolean;
}) {
  const router = useRouter();
  const { show } = useNotification();
  const [checkingAuth, setCheckingAuth] = useState(!!showAuthGate);

  useEffect(() => {
    if (!showAuthGate) return;
    const verify = async () => {
      try {
        const res = await apiFetch("api/auth/verify", { method: "GET" });
        const result = await res.json();
        if (
          res.status === 401 ||
          !result.user ||
          result.user.role !== "Admin"
        ) {
          router.replace("/login");
          return;
        }
        setCheckingAuth(false);
      } catch {
        router.replace("/login");
      }
    };
    verify();
  }, [router, showAuthGate]);

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
          msg: polished
            ? "Failed to read workbook. Please upload a valid .xlsx file."
            : "Failed to read workbook.",
          type: "error",
          closable: true,
          duration: null,
        });
      }
    },
    [onFileLoaded, polished, show],
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

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } =
    useDropzone({
      onDrop,
      onDropRejected,
      accept: {
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      maxFiles: 1,
    });

  if (checkingAuth) return null;

  const dropzoneClass = polished
    ? `w-full max-w-200 h-100 bg-accent rounded-sm p-4 ${isDragActive && "p-0!"} cursor-pointer border-2 border-dashed border-gray-400 dark:border-gray-600`
    : "w-full max-w-200 h-100 bg-accent rounded-sm p-4 cursor-pointer border-2 border-dashed";

  return (
    <div
      className={`p-4 w-full flex justify-center items-center ${
        polished ? "min-h-full h-full" : "min-h-[50dvh]"
      }`}
    >
      <div {...getRootProps()} className={dropzoneClass}>
        <input {...getInputProps()} />
        {polished && isDragActive ? (
          <div
            className={`w-full h-full flex justify-center items-center ${isDragAccept && "bg-green-300/70"} ${isDragReject && "bg-red-300/70"}`}
          >
            {isDragAccept && <Plus className="w-20 h-20" />}
            {isDragReject && <X className="w-20 h-20" />}
          </div>
        ) : (
          <div
            className={`flex flex-col gap-2 justify-center items-center h-full ${
              polished ? "relative md:text-lg" : ""
            }`}
          >
            <UploadCloud className="w-10 h-10" />
            {polished ? (
              <>
                <p>Drag and Drop File here</p>
                <p className="font-bold">OR</p>
                <p>Click to browse files</p>
                <p className="absolute bottom-0 left-0 text-gray-400">
                  Accepted File Types: xlsx
                </p>
              </>
            ) : (
              <p>Drag and drop .xlsx file</p>
            )}
            {!polished && isDragActive && isDragAccept && (
              <Plus className="w-12 h-12" />
            )}
            {!polished && isDragReject && <X className="w-12 h-12" />}
          </div>
        )}
      </div>
    </div>
  );
}

function WorksheetPickerStep({
  workbook,
  fileName,
  onSelect,
  onRedo,
  polished,
}: {
  workbook: ExcelJS.Workbook;
  fileName: string;
  onSelect: (ws: ExcelJS.Worksheet) => void;
  onRedo: () => void;
  polished?: boolean;
}) {
  if (!polished) {
    return (
      <div className="p-4 space-y-2">
        <p className="text-sm">
          File: <strong>{fileName}</strong>
        </p>
        <ul className="space-y-1">
          {workbook.worksheets.map((ws) => (
            <li
              key={ws.name}
              className="cursor-pointer p-2 border-b hover:bg-muted"
              onClick={() => onSelect(ws)}
            >
              {ws.name}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="p-4 w-full min-h-full h-full flex justify-center items-center">
      <div className="flex flex-col w-full max-w-200 h-100 bg-accent rounded-sm p-4 text-sm md:text-lg border">
        <div className="flex flex-row justify-between gap-2">
          <p className="mt-2 text-wrap">
            File: <strong>{fileName}</strong>
          </p>
          <button
            type="button"
            onClick={onRedo}
            className="text-white flex flex-row gap-1 h-fit justify-center items-center cursor-pointer p-2 transition-all duration-150 hover:bg-primary-hover bg-primary md:rounded-md rounded-full md:px-3 md:py-1"
          >
            <RefreshCcw className="w-4 h-4" />
            <span className="md:inline-block hidden">Redo</span>
          </button>
        </div>
        <div className="flex flex-col flex-1 min-h-0">
          <p>Choose a worksheet</p>
          <ScrollArea className="overflow-y-auto flex-1 pr-2">
            <ul>
              {workbook.worksheets.map((ws) => (
                <li
                  key={ws.name}
                  className="cursor-pointer p-2 transition-all duration-100 hover:bg-primary-hover border-b"
                  onClick={() => onSelect(ws)}
                >
                  {ws.name}
                </li>
              ))}
            </ul>
          </ScrollArea>
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
  variant = "default",
  onBack,
  onRedo,
}: {
  worksheet: ExcelJS.Worksheet;
  lockedCommunity?: string;
  submitPath: string;
  submitButtonLabel?: string;
  successMessage?: Props["successMessage"];
  variant?: Props["variant"];
  onBack: () => void;
  onRedo: () => void;
}) {
  const polished = variant === "polished";
  const { headers, rows: rawRows } = worksheetToRaw(worksheet);
  const requiredFields = getRequiredFields(lockedCommunity);
  const unmappedHeaders = getUnmappedHeaders(headers);
  const missingColumns = getMissingRequiredColumns(headers, lockedCommunity);

  const [parsedRows, setParsedRows] = useState<RowWithMeta[]>(() =>
    parseResidentRows(headers, rawRows, lockedCommunity),
  );
  const [submitting, setSubmitting] = useState(false);
  const { show } = useNotification();

  const invalidCount = parsedRows.filter((r) => r.missingFields.length > 0).length;
  const validCount = parsedRows.length - invalidCount;

  const visibleFields = DB_FIELDS.filter((field) =>
    parsedRows.some(
      (r) => r.data[field] && String(r.data[field]).trim() !== "",
    ),
  );
  const displayFields = Array.from(
    new Set([
      ...visibleFields.filter(
        (field) => !(field === "community" && lockedCommunity),
      ),
      ...requiredFields,
    ]),
  ) as (keyof ResidentImportRow)[];

  function updateCell(
    rowIndex: number,
    field: keyof ResidentImportRow,
    newVal: string,
  ) {
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
      const json = (await res.json()) as ImportSubmitResult;

      if (!res.ok && res.status !== 207) {
        throw new Error(json.msg ?? "Request failed");
      }

      const failureDetail = formatSubmitFailures(json);
      const serverFailedCount = Array.isArray(json.failed)
        ? json.failed.length
        : typeof json.failed === "number"
          ? json.failed
          : json.errors?.length ?? 0;

      if (serverFailedCount > 0) {
        const msg =
          successMessage?.(json) ??
          `${json.created ?? json.inserted ?? 0} succeeded, ${serverFailedCount} failed.`;
        show({
          msg: failureDetail ? `${msg} ${failureDetail}` : msg,
          type: "error",
          closable: true,
          duration: null,
        });
        return;
      }

      const msg =
        successMessage?.(json) ??
        `${json.created ?? json.inserted ?? validCount} row(s) processed.`;

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

  const redoButton = polished ? (
    <button
      type="button"
      onClick={onRedo}
      className="text-white flex flex-row gap-1 h-fit justify-center items-center cursor-pointer p-2 transition-all duration-150 hover:bg-primary-hover bg-primary md:rounded-md rounded-full md:px-3 md:py-1"
    >
      <RefreshCcw className="w-4 h-4" />
      <span className="md:inline-block hidden">Redo</span>
    </button>
  ) : (
    <button
      type="button"
      onClick={onRedo}
      className="p-2 bg-primary rounded-md text-white text-sm"
    >
      <RefreshCcw className="w-4 h-4 inline" /> Redo
    </button>
  );

  const submitButton = (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={invalidCount > 0 || submitting}
      className={
        polished
          ? `flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              invalidCount > 0 || submitting
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary-hover text-white cursor-pointer"
            }`
          : "flex items-center gap-1 px-3 py-1.5 rounded-md bg-primary text-white text-sm disabled:opacity-50"
      }
    >
      <Upload className="w-3.5 h-3.5" />
      {submitting
        ? "Submitting..."
        : polished
          ? `${submitButtonLabel} ${parsedRows.length} rows`
          : `${submitButtonLabel} (${parsedRows.length})`}
    </button>
  );

  return (
    <div
      className={`w-full flex flex-col gap-3 ${
        polished ? "h-full p-4 pb-24" : "min-h-[60dvh]"
      }`}
    >
      <div className="flex flex-row justify-between items-center">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className={
              polished
                ? "text-white p-1.5 rounded-full bg-primary hover:bg-primary-hover transition-all"
                : "p-1.5 rounded-full bg-primary text-white"
            }
            title={polished ? "Back to worksheet selection" : undefined}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
          {redoButton}
        </div>
        <div
          className={`flex items-center gap-3 ${polished ? "text-sm hidden md:flex" : ""}`}
        >
          {polished && (
            <>
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
            </>
          )}
          {submitButton}
        </div>
      </div>

      {missingColumns.length > 0 && (
        <div className="bg-amber-500/10 rounded-md px-4 py-2 text-sm text-amber-800 dark:text-amber-300">
          <span className="font-semibold">Unrecognized required columns: </span>
          {missingColumns.map((f) => FIELD_LABELS[f]).join(", ")}. Matching
          columns were not found in the file header — fill in the fields below
          or fix the spreadsheet.
        </div>
      )}

      {unmappedHeaders.length > 0 && (
        <div className="bg-muted/60 rounded-md px-4 py-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">Ignored columns: </span>
          {unmappedHeaders.join(", ")}
        </div>
      )}

      {invalidCount > 0 && (
        <div
          className={
            polished
              ? "bg-red-500/10 rounded-md px-4 py-2 text-sm text-red-600 dark:text-red-400"
              : "text-sm text-red-600"
          }
        >
          <span className={polished ? "font-semibold" : ""}>
            {invalidCount} row(s) have missing required fields.
          </span>
          {polished && (
            <> Fill in the highlighted cells before pushing to the database.</>
          )}
        </div>
      )}

      <div
        className={
          polished
            ? "flex-1 min-h-0 bg-accent rounded-sm border overflow-hidden"
            : "flex-1 border rounded-sm"
        }
      >
        <ScrollArea className={polished ? "w-full h-full" : "flex-1"}>
          <Table className={polished ? "min-w-fit" : undefined}>
            <TableHeader>
              <TableRow className={polished ? "bg-muted/60 hover:bg-muted/60" : ""}>
                <TableHead
                  className={
                    polished
                      ? "font-semibold w-12 text-center"
                      : undefined
                  }
                >
                  #
                </TableHead>
                {displayFields.map((field) => (
                  <TableHead
                    key={field}
                    className={
                      polished
                        ? "font-semibold whitespace-nowrap"
                        : undefined
                    }
                  >
                    {FIELD_LABELS[field]}
                    {REQUIRED_FIELDS.includes(field) && polished && (
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
                    polished && row.missingFields.length > 0
                      ? "bg-red-500/5 hover:bg-red-500/10"
                      : ""
                  }
                >
                  <TableCell
                    className={
                      polished
                        ? "text-center text-xs text-muted-foreground"
                        : undefined
                    }
                  >
                    {row.rawIndex}
                  </TableCell>
                  {displayFields.map((field) => (
                    <TableCell
                      key={field}
                      className={polished ? "p-1" : undefined}
                    >
                      <EditableCell
                        value={String(row.data[field] ?? "")}
                        isMissing={row.missingFields.includes(field)}
                        onSave={(val) => updateCell(rowIndex, field, val)}
                        polished={polished}
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

      {polished && (
        <p className="text-xs text-muted-foreground">
          Click any cell to edit inline. Fields marked with{" "}
          <span className="text-red-500">*</span> are required.
        </p>
      )}

      {polished && (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-20 border-t bg-background/95 backdrop-blur px-4 py-3 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm">
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4" />
                {validCount} valid
              </span>
              {invalidCount > 0 && (
                <span className="flex items-center gap-1 text-red-500 text-xs mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {invalidCount} errors
                </span>
              )}
            </div>
            {submitButton}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ResidentBulkImport({
  lockedCommunity,
  submitPath,
  submitButtonLabel,
  successMessage,
  variant = "default",
  showAuthGate = false,
}: Props) {
  const [step, setStep] = useState<"drop" | "pick" | "table">("drop");
  const [workbook, setWorkbook] = useState<ExcelJS.Workbook | null>(null);
  const [fileName, setFileName] = useState("");
  const [worksheet, setWorksheet] = useState<ExcelJS.Worksheet | null>(null);

  function handleRedo() {
    setWorkbook(null);
    setFileName("");
    setWorksheet(null);
    setStep("drop");
  }

  return (
    <div className={variant === "polished" ? "w-full h-full flex flex-col" : "pb-4"}>
      <ImportStepIndicator
        current={step}
        className={variant === "polished" ? "border-b shrink-0" : "mb-2"}
      />
      <div className={variant === "polished" ? "flex-1 min-h-0" : undefined}>
      {step === "drop" && (
        <DropzoneStep
          onFileLoaded={(wb, name) => {
            setWorkbook(wb);
            setFileName(name);
            setStep("pick");
          }}
          polished={variant === "polished"}
          showAuthGate={showAuthGate}
        />
      )}
      {step === "pick" && workbook && (
        <WorksheetPickerStep
          workbook={workbook}
          fileName={fileName}
          onSelect={(ws) => {
            setWorksheet(ws);
            setStep("table");
          }}
          onRedo={handleRedo}
          polished={variant === "polished"}
        />
      )}
      {step === "table" && worksheet && (
        <TableStep
          worksheet={worksheet}
          lockedCommunity={lockedCommunity}
          submitPath={submitPath}
          submitButtonLabel={submitButtonLabel}
          successMessage={successMessage}
          variant={variant}
          onBack={() => {
            setWorksheet(null);
            setStep("pick");
          }}
          onRedo={handleRedo}
        />
      )}
      </div>
    </div>
  );
}

"use client";

import React, {
  useCallback,
  useMemo,
  useState,
  Dispatch,
  SetStateAction,
} from "react";
import ExcelJS from "exceljs";
import { useDropzone } from "react-dropzone";
import type { FileRejection, FileWithPath } from "react-dropzone";
import { Plus, X, UploadCloud, RefreshCcw, Pencil } from "lucide-react";
import { useNotification } from "@/context/notification-context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

/* =========================
   FIELD CONFIGURATION
========================= */

const REQUIRED_SCHEMA_FIELDS = [
  "firstName",
  "lastName",
  "email",
  "community",
  "section",
  "room",
];

const FIELD_MAP: Record<string, string[]> = {
  firstName: ["First Name", "FirstName", "Given Name"],
  lastName: ["Last Name", "LastName", "Surname"],
  email: ["Email", "Email Address"],
  community: ["Community", "Assignment", "Building"],
  section: ["Section"],
  room: ["Room", "Room Number"],
};

function normalize(str: string) {
  return str.toLowerCase().replace(/\s+/g, "").trim();
}

/* =========================
   DROPZONE
========================= */

function MyDropzone() {
  const [workSheet, setWorkSheet] = useState<ExcelJS.Worksheet>();
  const [workbookFile, setWorkbookFile] = useState<ExcelJS.Workbook>();
  const [change, setChange] = useState<boolean>(false);
  const [chooseWorksheet, setChooseWorksheet] = useState<string[]>([]);
  const { show } = useNotification();

  const resetUpload = useCallback(() => {
    setChange(false);
    setWorkSheet(undefined);
    setWorkbookFile(undefined);
    setChooseWorksheet([]);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) return;

    try {
      const file = acceptedFiles[0];
      const buffer: ArrayBuffer = await file.arrayBuffer();

      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      setWorkbookFile(workbook);

      const names = workbook.worksheets.map((ws) => ws.name);
      setChooseWorksheet(names);
      setChange(true);
    } catch {
      setWorkbookFile(undefined);
      setChooseWorksheet([]);
      setWorkSheet(undefined);
      setChange(false);
      show({
        msg: "Failed to read workbook. Please upload a valid .xlsx file.",
        type: "error",
        closable: true,
        duration: null,
      });
    }
  }, [show]);

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

  function selectWorksheet(chosen: string) {
    const worksheet = workbookFile?.worksheets.find((ws) => ws.name === chosen);
    setWorkSheet(worksheet);
  }

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    isDragReject,
    isDragAccept,
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
    <>
      {!change && (
        <div className="p-4 w-full min-h-dvh flex justify-center items-center">
          <div
            {...getRootProps()}
            className={`w-full max-w-200 h-100 bg-accent rounded-sm p-4 ${
              isDragActive && "p-0!"
            } cursor-pointer border-2 border-dashed border-gray-400`}
          >
            <input {...getInputProps()} />
            {isDragActive ? (
              <div
                className={`w-full h-full flex justify-center items-center ${
                  isDragAccept && "bg-green-300/70"
                } ${isDragReject && "bg-red-300/70"}`}
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
              </div>
            )}
          </div>
        </div>
      )}

      {change && !workSheet && (
        <div className="p-4 w-full min-h-dvh flex justify-center items-center">
          <div className="flex flex-col w-full max-w-200 h-100 bg-accent rounded-sm p-4 border">
            <div className="flex flex-row justify-between gap-2">
              <p>
                File: <strong>{acceptedFiles[0]?.name}</strong>
              </p>
              <button
                onClick={resetUpload}
                className="p-2 bg-primary text-white rounded-md hover:bg-primary-hover"
              >
                <RefreshCcw className="w-4 h-4" />
              </button>
            </div>

            <ScrollArea className="flex-1 mt-4">
              <ul>
                {chooseWorksheet.map((ws) => (
                  <li
                    key={ws}
                    className="cursor-pointer p-2 hover:bg-primary-hover border-b"
                    onClick={() => selectWorksheet(ws)}
                  >
                    {ws}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        </div>
      )}

      {workSheet && (
        <WorksheetTable
          key={workSheet.name}
          worksheet={workSheet}
          setWorkSheet={setWorkSheet}
          setChange={setChange}
          onReset={resetUpload}
        />
      )}

    </>
  );
}

/* =========================
   TABLE LOGIC
========================= */

function worksheetToTableData(worksheet: ExcelJS.Worksheet) {
  let headers: string[] = [];
  const rows: string[][] = [];

  worksheet.eachRow((row, rowNumber) => {
    const rowText: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowText[colNumber - 1] = cell.text ?? "";
    });

    if (rowNumber === 1) {
      headers = rowText;
    } else {
      rows.push(rowText);
    }
  });

  return { headers, rows };
}

function WorksheetTable({
  worksheet,
  setWorkSheet,
  setChange,
  onReset,
}: {
  worksheet: ExcelJS.Worksheet;
  setWorkSheet: Dispatch<SetStateAction<ExcelJS.Worksheet | undefined>>;
  setChange: Dispatch<SetStateAction<boolean>>;
  onReset: () => void;
}) {
  const { headers, rows } = worksheetToTableData(worksheet);

  const [tableData, setTableData] = useState<string[][]>(rows);
  const [isEditing, setIsEditing] = useState(false);

  /* =========================
     HEADER MATCHING
  ========================= */

  const matchedFields = useMemo(() => {
    const normalizedHeaders = headers.map((h) => normalize(h));
    const result: Record<string, string> = {};

    Object.entries(FIELD_MAP).forEach(([schemaKey, aliases]) => {
      const normalizedAliases = aliases.map(normalize);
      const foundIndex = normalizedHeaders.findIndex((h) =>
        normalizedAliases.includes(h),
      );

      if (foundIndex !== -1) {
        result[schemaKey] = headers[foundIndex];
      }
    });

    return result;
  }, [headers]);

  const missingRequiredColumns = REQUIRED_SCHEMA_FIELDS.filter(
    (field) => !matchedFields[field],
  );

  /* =========================
     ROW VALIDATION
  ========================= */

  const rowErrors = tableData.map((row, rowIndex) => {
    const missing = REQUIRED_SCHEMA_FIELDS.filter((field) => {
      const header = matchedFields[field];
      if (!header) return true;

      const colIndex = headers.indexOf(header);
      const value = row[colIndex];
      return !value || value.trim() === "";
    });

    return missing.length > 0 ? rowIndex : null;
  });

  const hasRowError = (rowIndex: number) => rowErrors.includes(rowIndex);

  const isRequiredColumn = (header: string) => {
    const normalizedHeader = normalize(header);

    return REQUIRED_SCHEMA_FIELDS.some((field) =>
      FIELD_MAP[field].map(normalize).includes(normalizedHeader),
    );
  };

  return (
    <div className="w-full h-dvh flex flex-col items-center gap-2 p-4">
      <div className="flex flex-col w-full bg-accent rounded-sm py-4 pl-4 pr-2 border gap-2">
        <div className="flex justify-between items-center">
          <p className="text-muted-foreground">Worksheet preview</p>

          <div className="flex gap-2 items-center">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="flex items-center gap-1 p-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              <Pencil className="w-4 h-4" />
              {isEditing ? "Done" : "Edit"}
            </button>

            <button
              onClick={() => {
                setChange(false);
                setWorkSheet(undefined);
                onReset();
              }}
              className="p-2 bg-primary text-white rounded-md hover:bg-primary-hover"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {missingRequiredColumns.length > 0 && (
          <div className="p-3 rounded-md bg-red-100 border border-red-400 text-red-700 text-sm">
            <p className="font-semibold mb-1">Missing Required Columns:</p>
            <ul className="list-disc list-inside">
              {missingRequiredColumns.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        <ScrollArea className="w-full pr-2 pb-2">
          <Table className="min-w-fit border rounded-md overflow-hidden">
            <TableHeader>
              <TableRow className="bg-muted/60">
                {headers.map((header, i) => {
                  const required = isRequiredColumn(header);
                  return (
                    <TableHead
                      key={`${header}-${i}`}
                      className={`font-semibold ${
                        required ? "" : "text-gray-400 bg-muted/40"
                      }`}
                    >
                      {header}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>

            <TableBody>
              {tableData.map((row, rowIndex) => {
                const error = hasRowError(rowIndex);

                return (
                  <TableRow
                    key={rowIndex}
                    className={error ? "bg-red-500/10" : ""}
                  >
                    {headers.map((header, cellIndex) => {
                      const cell = row[cellIndex] ?? "";
                      const required = isRequiredColumn(header);

                      return (
                        <TableCell
                          key={cellIndex}
                          className={
                            required ? "" : "text-gray-400 bg-muted/30"
                          }
                        >
                          {isEditing ? (
                            <input
                              value={cell}
                              onChange={(e) => {
                                const updated = [...tableData];
                                updated[rowIndex][cellIndex] = e.target.value;
                                setTableData(updated);
                              }}
                              className="w-full bg-transparent outline-none"
                            />
                          ) : (
                            cell
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}

function Page() {
  return (
    <div className="w-dvw min-h-dvh">
      <MyDropzone />
    </div>
  );
}

export default Page;

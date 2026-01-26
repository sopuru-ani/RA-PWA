"use client";
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

import ExcelJS from "exceljs";
import type { FileWithPath } from "react-dropzone";

function MyDropzone() {
  const [workSheet1, setWorkSheet1] = useState<ExcelJS.Worksheet>();
  const onDrop = useCallback(async (acceptedFiles: FileWithPath[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];

    const buffer: ArrayBuffer = await file.arrayBuffer();

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) return;

    setWorkSheet1(worksheet);

    worksheet.eachRow((row, rowNumber) => {
      console.log(rowNumber, row.values);
    });
  }, []);
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    acceptedFiles,
    isDragReject,
    isDragAccept,
    fileRejections,
  } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
        ".xlsx",
      ],
    },
    maxFiles: 1,
  });

  return (
    <div {...getRootProps()} className="w-full h-full bg-blue-300">
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop the files here ...</p>
      ) : (
        <p>Drag 'n' drop some files here, or click to select files</p>
      )}
      {isDragAccept && <p className="bg-green-300">Good shi</p>}
      {isDragReject && <p className="bg-red-300">Bad shii</p>}
      {acceptedFiles.length > 0 && (
        <p className="mt-2 text-sm">
          File: <strong>{acceptedFiles[0].name}</strong>
        </p>
      )}
      {fileRejections.length > 0 && (
        <div className="text-red-600">
          {fileRejections.map(({ file, errors }) => (
            <div key={file.name}>
              <strong>{file.name}</strong>
              <ul>
                {errors.map((e) => (
                  <li key={e.code}>{e.message}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      {workSheet1 && <WorksheetTable worksheet={workSheet1} />}
    </div>
  );
}
function worksheetToTableData(worksheet: ExcelJS.Worksheet) {
  let headers: string[] = [];
  const rows: ExcelJS.CellValue[][] = [];

  worksheet.eachRow((row, rowNumber) => {
    const values: ExcelJS.CellValue[] = Array.isArray(row.values)
      ? row.values
      : [];

    const sliced = values.slice(1);

    if (rowNumber === 1) {
      headers = sliced as string[];
    } else {
      rows.push(sliced);
    }
  });

  return { headers, rows };
}

function WorksheetTable({ worksheet }: { worksheet: ExcelJS.Worksheet }) {
  const { headers, rows } = worksheetToTableData(worksheet);

  return (
    <table className="border-collapse border border-gray-400 w-full">
      <thead>
        <tr>
          {headers.map((header, i) => (
            <th
              key={i}
              className="border border-gray-300 px-2 py-1 bg-gray-100 text-left"
            >
              {String(header)}
            </th>
          ))}
        </tr>
      </thead>

      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="border border-gray-300 px-2 py-1">
                {cell !== null && cell !== undefined ? String(cell) : ""}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function page() {
  return (
    <>
      <div className="w-dvw h-dvh">
        <MyDropzone />
      </div>
    </>
  );
}

export default page;

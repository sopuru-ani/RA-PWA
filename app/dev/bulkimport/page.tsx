"use client";

import ResidentBulkImport from "@/components/housing/ResidentBulkImport";
import type { ImportSubmitResult } from "@/components/housing/ResidentBulkImport";

function adminSuccessMessage(result: ImportSubmitResult): string {
  const success = result.inserted ?? 0;
  const failed =
    typeof result.failed === "number"
      ? result.failed
      : Array.isArray(result.failed)
        ? result.failed.length
        : result.errors?.length ?? 0;

  if (failed === 0) {
    return `${success} residents added successfully.`;
  }
  return `${success} succeeded, ${failed} failed.`;
}

export default function DevBulkImportPage() {
  return (
    <ResidentBulkImport
      submitPath="api/admin/seed-residents"
      submitButtonLabel="Push"
      variant="polished"
      successMessage={adminSuccessMessage}
    />
  );
}

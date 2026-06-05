import { redirect } from "next/navigation";

export default function LegacyBulkImportPage() {
  redirect("/admin/residents/bulk");
}

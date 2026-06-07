import type { ResidentChangeRequestType } from "@/types/admin";

export function requestTypeLabel(type?: ResidentChangeRequestType): string {
  if (type === "update") return "Update";
  if (type === "remove") return "Removal";
  return "Add";
}

export function requestTypeBadgeVariant(
  type?: ResidentChangeRequestType,
): "default" | "secondary" | "destructive" | "outline" {
  if (type === "update") return "secondary";
  if (type === "remove") return "destructive";
  return "outline";
}

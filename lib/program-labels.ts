import type {
  ProgramCategory,
  ProgramCreatorRole,
  ProgramStatus,
  RsvpStatus,
} from "@/types/programs";

export const PROGRAM_CATEGORY_LABELS: Record<ProgramCategory, string> = {
  staff_meeting: "Staff meeting",
  training: "Training",
  hall_event: "Hall event",
  community_program: "Community program",
  duty: "Duty",
  deadline: "Deadline",
  other: "Other",
};

export const PROGRAM_STATUS_LABELS: Record<ProgramStatus, string> = {
  draft: "Draft",
  pending_approval: "Pending approval",
  published: "Published",
  rejected: "Rejected",
  cancelled: "Cancelled",
};

export const RSVP_STATUS_LABELS: Record<RsvpStatus, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  tentative: "Tentative",
};

export const AUDIENCE_TYPE_LABELS: Record<string, string> = {
  all_staff: "All staff",
  all_ras: "All RAs",
  all_gas: "All area directors",
  selected_users: "Selected users",
  selected_communities: "Selected communities",
  community_staff: "Community staff",
};

export function programsBasePath(role: ProgramCreatorRole | string): string {
  switch (role) {
    case "Admin":
      return "/admin/programs";
    case "GA":
      return "/ga/dashboard/programs";
    case "SA":
      return "/sa/dashboard/programs";
    default:
      return "/ra/dashboard/programs";
  }
}

export function calendarPath(role: ProgramCreatorRole | string): string {
  switch (role) {
    case "Admin":
      return "/admin/calendar";
    case "GA":
      return "/ga/calendar";
    case "SA":
      return "/sa/calendar";
    default:
      return "/ra/dashboard/calendar";
  }
}

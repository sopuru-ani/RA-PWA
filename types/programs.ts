export type ProgramStatus =
  | "draft"
  | "pending_approval"
  | "published"
  | "rejected"
  | "cancelled";

export type ProgramCreatorRole = "Admin" | "GA" | "RA" | "SA";

export type ProgramCategory =
  | "staff_meeting"
  | "training"
  | "hall_event"
  | "community_program"
  | "duty"
  | "deadline"
  | "other";

export type ProgramVisibility = "invite_only" | "community" | "department";

export type ProgramAudienceType =
  | "all_staff"
  | "all_ras"
  | "all_gas"
  | "selected_users"
  | "selected_communities"
  | "community_staff";

export type RsvpStatus = "pending" | "accepted" | "declined" | "tentative";

export type AttendanceStatus = "unmarked" | "absent" | "attended" | "excused";

export type ProgramAudience = {
  type: ProgramAudienceType;
  userIds?: string[];
  roles?: ("RA" | "GA" | "SA")[];
};

export type Program = {
  _id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  timezone: string;
  category: ProgramCategory;
  status: ProgramStatus;
  requiredAttendance: boolean;
  visibility: ProgramVisibility;
  communities: string[];
  sections?: string[];
  audience: ProgramAudience;
  createdBy: string;
  createdByRole: ProgramCreatorRole;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    bucket: string;
    uploadedAt?: string;
  }>;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  submittedAt?: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type ProgramInvite = {
  _id: string;
  programId: string;
  userId: string;
  rsvpStatus: RsvpStatus;
  attendanceStatus: AttendanceStatus;
  syncedToCalendar: boolean;
  reminderSent: boolean;
  checkedInAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CalendarEvent = {
  id: string;
  title: string;
  date: string;
  startTime?: string;
  endTime?: string;
  meta: {
    requiredAttendance: boolean;
    rsvpStatus?: RsvpStatus;
    location?: string;
    category: string;
    status: string;
  };
};

export type ProgramStats = {
  upcomingCount: number;
  pendingRsvpCount: number;
  requiredCount: number;
  draftOrPendingOwnCount: number;
  pendingApprovalCount?: number;
};

export type CreateProgramInput = {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location?: string;
  timezone?: string;
  category?: ProgramCategory;
  requiredAttendance?: boolean;
  visibility?: ProgramVisibility;
  communities?: string[];
  sections?: string[];
  audience: ProgramAudience;
};

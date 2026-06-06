import type { ProgramStats } from "@/types/programs";

export type GAUser = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
};

export type GACommunityDetail = {
  name: string;
  sections: string[];
  residentCount: number;
  sectionStaff: {
    section: string;
    raEmail: string;
    gaEmail: string;
  }[];
  gaStaff: unknown[];
  saStaff: unknown[];
  raCount: number;
};

export type GADashboardStats = {
  residents: number;
  sections: number;
  pendingRequests: number;
  openIncidents: number;
  myPendingRequests: number;
  programStats?: ProgramStats;
};

export type ResidentChangeRequestType = "add" | "update" | "remove";

export type ResidentChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected";

export type ResidentRequestListItem = {
  _id: string;
  residentId?: string;
  requestType?: ResidentChangeRequestType;
  status: ResidentChangeRequestStatus;
  community: string;
  section: string;
  room: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  notes?: string;
  createdAt: string;
  rejectionReason?: string;
  removalReason?: string;
};

export type AdminUser = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
};

export type AdminDashboardStats = {
  communities: number;
  residents: number;
  sections: number;
  pendingInvites: number;
  pendingResidentRequests: number;
  staff: {
    RA: number;
    GA: number;
    SA: number;
    Admin: number;
  };
};

export type StaffListItem = {
  id: string;
  source: "user" | "authorized";
  email: string;
  fullName: string | null;
  role: string;
  status: "active" | "inactive" | "pending";
  communities: string[];
  assignments: string[];
  hasAccount: boolean;
  isActive: boolean;
};

export type CommunitySummary = {
  community: string;
  sections: string[];
  sectionCount: number;
  residentCount: number;
  raCount: number;
  gaCount: number;
  saCount: number;
};

export type SectionSummary = {
  name: string;
  roomCount: number;
  residentCount: number;
  hasRa: boolean;
};

export type CommunityDetail = {
  name: string;
  sections: string[];
  residentCount: number;
  roomCount: number;
  sectionSummaries: SectionSummary[];
  sectionStaff: {
    section: string;
    raEmail: string;
    gaEmail: string;
  }[];
};

export type ResidentWithStaff = {
  _id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  community: string;
  section: string;
  room: string;
  notes?: string;
  raEmail?: string;
  gaEmail?: string;
};

export type ResidentChangeRequestType = "add" | "update" | "remove";

export type ResidentChangeRequestStatus =
  | "pending"
  | "approved"
  | "rejected";

/** Matches API lean documents from ResidentChangeRequest (residentadditionrequests collection). */
export type ResidentChangeRequestItem = {
  _id: string;
  requestType?: ResidentChangeRequestType;
  status: ResidentChangeRequestStatus;
  residentId?: string;
  fullName: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  community: string;
  section: string;
  room: string;
  notes?: string;
  submittedByEmail: string;
  batchId?: string;
  batchRowIndex?: number;
  previousSnapshot?: ResidentWithStaff;
  removalReason?: string;
  rejectionReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

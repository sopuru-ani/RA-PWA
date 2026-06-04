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
};

export type ResidentRequestListItem = {
  _id: string;
  status: "pending" | "approved" | "rejected";
  community: string;
  section: string;
  room: string;
  fullName: string;
  email: string;
  studentId: string;
  createdAt: string;
  rejectionReason?: string;
};

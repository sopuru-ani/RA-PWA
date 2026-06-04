export type SAUser = {
  firstName: string;
  lastName: string;
  role: string;
  email: string;
  assignment: string[];
  community: string[];
};

export type SACommunityDetail = {
  name: string;
  sections: string[];
  residentCount: number;
  sectionStaff: {
    section: string;
    raEmail: string;
    gaEmail: string;
  }[];
  raCount: number;
};

export type SADashboardStats = {
  residents: number;
  sections: number;
  communityOpenIncidents: number;
  myIncidents: number;
  myOpenIncidents: number;
};

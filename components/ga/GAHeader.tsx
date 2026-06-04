"use client";

import DashboardHeader from "@/components/housing/DashboardHeader";
import { useGASession } from "@/context/GASessionContext";
import { roleLabelLong } from "@/lib/role-labels";

function GAHeader() {
  const { user, community, stats } = useGASession();

  return (
    <DashboardHeader
      roleLabel={roleLabelLong("GA")}
      name={`${user.firstName} ${user.lastName}`}
      subtitle={community.name}
      stats={[
        { value: stats.residents, label: "Residents" },
        { value: stats.sections, label: "Sections" },
        { value: stats.openIncidents, label: "Open incidents" },
        { value: stats.myPendingRequests, label: "Pending adds" },
      ]}
    />
  );
}

export default GAHeader;

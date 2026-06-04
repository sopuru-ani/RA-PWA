"use client";

import DashboardHeader from "@/components/housing/DashboardHeader";
import { useSASession } from "@/context/SASessionContext";
import { roleLabelLong } from "@/lib/role-labels";

function SAHeader() {
  const { user, community, stats } = useSASession();

  return (
    <DashboardHeader
      roleLabel={roleLabelLong("SA")}
      name={`${user.firstName} ${user.lastName}`}
      subtitle={community.name}
      stats={[
        { value: stats.residents, label: "Residents" },
        { value: stats.sections, label: "Sections" },
        { value: stats.myOpenIncidents, label: "My open reports" },
      ]}
    />
  );
}

export default SAHeader;

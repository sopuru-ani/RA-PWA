"use client";

import DashboardHeader from "@/components/housing/DashboardHeader";
import { useAdminSession } from "@/context/AdminSessionContext";

function AdminHeader() {
  const { user, stats } = useAdminSession();

  return (
    <DashboardHeader
      roleLabel="Administrator"
      name={`${user.firstName} ${user.lastName}`}
      subtitle="All communities"
      stats={[
        { value: stats.communities, label: "Communities" },
        { value: stats.residents, label: "Residents" },
        { value: stats.pendingInvites, label: "Pending invites" },
        {
          value: stats.pendingResidentRequests ?? 0,
          label: "Resident requests",
        },
      ]}
    />
  );
}

export default AdminHeader;

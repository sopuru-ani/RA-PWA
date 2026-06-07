import { AUDIENCE_TYPE_LABELS } from "@/lib/program-labels";
import { roleLabelShort } from "@/lib/role-labels";
import type { Program } from "@/types/programs";

function audienceScope(program: Program): string {
  if (
    program.communities.length === 0 ||
    program.visibility === "department"
  ) {
    return "department-wide";
  }
  if (program.communities.length === 1) {
    return program.communities[0];
  }
  return `${program.communities.length} communities`;
}

export function formatProgramAudienceSummary(program: Program): string {
  const { audience } = program;
  const scope = audienceScope(program);

  switch (audience.type) {
    case "all_staff":
      return `All staff · ${scope}`;
    case "all_ras":
      return `All RAs · ${scope}`;
    case "all_gas":
      return `All area directors · ${scope}`;
    case "selected_users": {
      const count = audience.userIds?.length ?? 0;
      return `${count} selected staff member${count === 1 ? "" : "s"}`;
    }
    case "selected_communities":
      return `${program.communities.length} selected communit${program.communities.length === 1 ? "y" : "ies"}`;
    case "community_staff": {
      const roles = audience.roles ?? [];
      if (roles.length === 0) {
        return `Community staff · ${scope}`;
      }
      const labels = roles
        .map((r) => (r === "GA" ? roleLabelShort("GA") : r))
        .join(", ");
      return `${labels} · ${scope}`;
    }
    default:
      return AUDIENCE_TYPE_LABELS[audience.type] ?? audience.type;
  }
}

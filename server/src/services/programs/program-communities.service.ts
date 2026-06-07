import { Community, type CommunityLean } from "../../lib/models.js";

export async function listProgramCommunityOptions(): Promise<
  { name: string; sections: string[] }[]
> {
  const communities = await Community.find().lean<CommunityLean[]>();
  return communities.map((c) => ({
    name: c.community,
    sections: c.section ?? [],
  }));
}

import type { Response } from "express";
import { connectDB } from "../../lib/connect.js";
import type { AuthenticatedRequest } from "../../middleware/auth.js";
import {
  requirePrimaryCommunity,
  assertSectionInCommunity,
  scopeError,
} from "../../lib/community-scope.js";
import { Community } from "../../lib/models.js";
import {
  getInspectionSessionData,
  saveRoomCheck,
  getWalkthroughRooms,
  completeInspectionSession,
  listCompletedWalkthroughsForCommunity,
  listInProgressSessions,
} from "../../services/housing/inspections.service.js";

async function resolveSection(
  req: AuthenticatedRequest,
  sectionFromBody?: string,
): Promise<{ community: string; section: string }> {
  const community = requirePrimaryCommunity(req.dbUser!);
  const section =
    sectionFromBody ??
    (typeof req.query.section === "string" ? req.query.section : undefined);

  if (!section) {
    throw scopeError("Section is required", 400);
  }

  const communityDoc = await Community.findOne({ community }).lean();
  if (!communityDoc) {
    throw scopeError("Community not found", 404);
  }
  assertSectionInCommunity(
    communityDoc as { section?: string[] },
    section,
  );
  return { community, section };
}

export async function listWalkthroughs(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const community = requirePrimaryCommunity(req.dbUser!);

  const [walkthroughs, inProgress] = await Promise.all([
    listCompletedWalkthroughsForCommunity(community),
    listInProgressSessions(community),
  ]);

  res.status(200).json({
    msg: "Walkthroughs",
    walkthroughs,
    inProgress,
  });
}

export async function getInspectionSession(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { section } = req.body as { section?: string };
  const { community, section: resolvedSection } = await resolveSection(
    req,
    section,
  );

  const dbUser = req.dbUser!;
  const data = await getInspectionSessionData(community, resolvedSection);

  res.status(200).json({
    msg: "Inspection session",
    ...data,
    user: {
      firstName: dbUser.firstName,
      lastName: dbUser.lastName,
      assignment: [resolvedSection],
      community: [community],
      role: dbUser.role,
    },
  });
}

export async function roomCheck(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { data, sessionId, sessionDate, section } = req.body as {
    data: {
      room: string;
      residents: {
        studentId: string;
        name: string;
        email: string;
        isPass: boolean;
        notes?: string;
      }[];
    };
    sessionId: string;
    sessionDate: string;
    section?: string;
  };

  const { community, section: resolvedSection } = await resolveSection(
    req,
    section,
  );
  const dbUser = req.dbUser!;
  const inspectorName = `${dbUser.firstName} ${dbUser.lastName}`;

  const newRoomcheck = await saveRoomCheck(
    community,
    resolvedSection,
    inspectorName,
    sessionId,
    sessionDate,
    data,
  );

  res.status(200).json({
    msg: (newRoomcheck as unknown as { inspectionDate: Date }).inspectionDate,
  });
}

export async function walkthrough(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { sessionId, section } = req.body as {
    sessionId: string;
    section?: string;
  };
  const { community, section: resolvedSection } = await resolveSection(
    req,
    section,
  );

  const roomsChecked = await getWalkthroughRooms(
    community,
    resolvedSection,
    sessionId,
  );

  res.status(200).json({ msg: "Walkthrough rooms", roomsChecked });
}

export async function allChecked(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();
  const { sessionId, sessionDate, section } = req.body as {
    sessionId: string;
    sessionDate: string;
    section?: string;
  };
  const { community, section: resolvedSection } = await resolveSection(
    req,
    section,
  );

  await completeInspectionSession(
    community,
    resolvedSection,
    sessionId,
    sessionDate,
  );

  res.status(200).json({ msg: "Successful" });
}

import type { Response } from "express";
import { connectDB } from "../lib/connect.js";
import type { AuthenticatedRequest } from "../middleware/auth.js";
import {
  canSubmitIncident,
  getPrimaryCommunity,
} from "../lib/community-scope.js";
import {
  assertCanDeleteIncident,
  assertCanModifyIncident,
} from "../lib/incident-permissions.js";
import {
  Room,
  Community,
  Incident,
  type IIncident,
  type RoomLean,
  type CommunityLean,
  type IncidentLean,
} from "../lib/models.js";

function normalizeInvolved(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  if (typeof value === "string" && value) return [value];
  return [];
}

export async function createOrUpdateIncident(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  try {
    const dbUser = req.dbUser;
    if (!dbUser) {
      res.status(401).json({ msg: "Unauthorized" });
      return;
    }

    if (!canSubmitIncident(dbUser.role)) {
      res.status(403).json({ msg: "Your role cannot submit incidents" });
      return;
    }

    const userCommunity = getPrimaryCommunity(dbUser);
    if (!userCommunity) {
      res.status(403).json({ msg: "No community assigned" });
      return;
    }

    const body = req.body;
    const incidentId = (body.id as string) || null;
    const communityIncident = (body.community as string) || null;
    const sectionIncident = (body.section as string) || null;
    const roomIncident = (body.room as string) || null;
    const locationIncident = (body.location as string) || null;
    const involvedIncident = normalizeInvolved(body.involved);
    const typeIncident = (body.type as string) || null;
    const titleIncident = (body.title as string) || null;
    const descriptionIncident = (body.description as string) || null;
    const dateIncident = (body.incidentDate as string) || null;
    const resolvedIncidentRaw = body.resolved;
    const resolvedIncident: boolean | null =
      resolvedIncidentRaw === undefined || resolvedIncidentRaw === null
        ? null
        : resolvedIncidentRaw === "true" || resolvedIncidentRaw === true;

    const resolvedDateIncidentRaw = body.resolvedDate as string | null;
    let resolvedDateIncident: Date | undefined;

    if (resolvedDateIncidentRaw) {
      const parsed = new Date(resolvedDateIncidentRaw);
      if (!isNaN(parsed.getTime())) {
        resolvedDateIncident = parsed;
      }
    }

    if (!dateIncident) {
      res.status(400).json({ msg: "Incident date is required" });
      return;
    }

    const parsedDate = new Date(dateIncident);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ msg: "Invalid incident date" });
      return;
    }

    let existingIncident: IncidentLean | null = null;
    if (incidentId) {
      existingIncident = await Incident.findById(incidentId).lean<IncidentLean>();
      if (!existingIncident) {
        res.status(404).json({ msg: "Incident not found" });
        return;
      }
      try {
        assertCanModifyIncident(dbUser, existingIncident);
      } catch (err) {
        const statusCode =
          err &&
          typeof err === "object" &&
          "statusCode" in err &&
          typeof (err as { statusCode: unknown }).statusCode === "number"
            ? (err as { statusCode: number }).statusCode
            : 403;
        res.status(statusCode).json({
          msg: err instanceof Error ? err.message : "Forbidden",
        });
        return;
      }
    }

    const room = await Room.find({
      community: userCommunity,
    }).lean<RoomLean[]>();
    const community = await Community.findOne({
      community: userCommunity,
    }).lean<CommunityLean>();

    if (!community) {
      res
        .status(401)
        .json({ msg: "Genuine Bad Request. Community doesn't exist" });
      return;
    }

    if (!typeIncident) {
      res.status(400).json({ msg: "Incident type is required" });
      return;
    }

    if (!titleIncident) {
      res.status(400).json({ msg: "Title is required" });
      return;
    }

    if (!descriptionIncident) {
      res.status(400).json({ msg: "Description is required" });
      return;
    }

    if (!dateIncident) {
      res.status(400).json({ msg: "Incident date is required" });
      return;
    }

    if (typeIncident === "Policy Violation") {
      if (!roomIncident && !locationIncident) {
        res.status(400).json({
          msg: "A Room or Location is required for Policy Violations",
        });
        return;
      }

      if (roomIncident) {
        if (!communityIncident || !sectionIncident) {
          res.status(400).json({
            msg: "If you specify a room, you must specify a community and section",
          });
          return;
        }

        if (communityIncident !== userCommunity) {
          res.status(400).json({ msg: "Enter your assigned community" });
          return;
        }

        if (
          !community.section.some(
            (r: string) => r.toLowerCase() === sectionIncident.toLowerCase(),
          )
        ) {
          res.status(400).json({ msg: "Invalid section" });
          return;
        }

        const findRoom = room.find(
          (doc) => doc.section === sectionIncident && doc.room === roomIncident,
        );
        if (!findRoom) {
          res.status(404).json({ msg: "Invalid Room entry" });
          return;
        }
      }
    } else if (typeIncident === "Maintenance") {
      if (roomIncident) {
        if (!communityIncident || !sectionIncident) {
          res.status(400).json({
            msg: "Community and Section are required for a Maintenance incident",
          });
          return;
        }

        const findRoom = room.find(
          (doc) =>
            doc.section.toLowerCase() === sectionIncident.toLowerCase() &&
            doc.room === roomIncident,
        );
        if (!findRoom) {
          res.status(404).json({ msg: "Invalid Room entry" });
          return;
        }
      }
    } else {
      if (!roomIncident && !locationIncident) {
        res
          .status(400)
          .json({ msg: "A Room or Location is required" });
        return;
      }
      if (communityIncident && communityIncident !== userCommunity) {
        res.status(400).json({
          msg: "If incident took place outside your assigned community, use the location field only",
        });
        return;
      }
    }

    let result;

    if (incidentId) {
      result = await Incident.findByIdAndUpdate(
        incidentId,
        {
          community: communityIncident,
          section: sectionIncident,
          room: roomIncident,
          location: locationIncident,
          involved: involvedIncident,
          type: typeIncident,
          title: titleIncident,
          description: descriptionIncident,
          incidentDate: new Date(dateIncident),
          resolved: resolvedIncident,
          resolvedAt: resolvedDateIncident,
        },
        { new: true },
      );
    } else {
      result = await Incident.create({
        community: communityIncident ?? userCommunity,
        section: sectionIncident,
        room: roomIncident,
        location: locationIncident,
        reporter: dbUser.fullName,
        reporterUserId: dbUser._id,
        reporterRole: dbUser.role as "RA" | "GA" | "SA",
        involved: involvedIncident,
        type: typeIncident,
        title: titleIncident,
        description: descriptionIncident,
        incidentDate: new Date(dateIncident),
      } as Partial<IIncident>);
    }

    res.status(incidentId ? 200 : 201).json({
      msg: incidentId
        ? "Incident updated successfully"
        : "Incident created successfully",
      data: result,
    });
  } catch {
    res.status(500).json({ msg: "Internal Server Error" });
  }
}

export async function deleteIncident(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  await connectDB();

  const dbUser = req.dbUser;
  if (!dbUser) {
    res.status(401).json({ msg: "Unauthorized" });
    return;
  }

  const userCommunity = getPrimaryCommunity(dbUser);

  const { incidentId } = req.body;
  const id = incidentId;

  if (!id) {
    res.status(400).json({ msg: "Incident id is required" });
    return;
  }

  try {
    const existing = await Incident.findById(id).lean<IncidentLean>();
    if (!existing) {
      res.status(404).json({ msg: "Incident not found" });
      return;
    }

    try {
      assertCanDeleteIncident(dbUser, existing);
    } catch (err) {
      const statusCode =
        err &&
        typeof err === "object" &&
        "statusCode" in err &&
        typeof (err as { statusCode: unknown }).statusCode === "number"
          ? (err as { statusCode: number }).statusCode
          : 403;
      res.status(statusCode).json({
        msg: err instanceof Error ? err.message : "Forbidden",
      });
      return;
    }

    await Incident.findByIdAndDelete(id);

    res.status(200).json({ msg: "Incident deleted successfully" });
  } catch (error) {
    res.status(500).json({
      msg: "Internal Server Error",
      error: error instanceof Error ? error.message : "Unknown Error",
    });
  }
}

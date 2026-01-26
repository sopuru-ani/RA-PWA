import { NextRequest, NextResponse } from "next/server";

import connectDB from "@/lib/connect";
import User from "@/db/user.model";
import Room, { RoomLean } from "@/db/room.model";
import Community, { CommunityLean } from "@/db/community.models";
import Incident, { IIncident, IncidentLean } from "@/db/incident.model";
import jwt from 'jsonwebtoken';

const secretKey = process.env.JWT_SECRET!;
export async function POST(req: NextRequest) {

    await connectDB();
    try {
        const token = req.cookies.get("token")?.value;
        if(!token) return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });


        const formData = await req.formData();
        if(!formData) return NextResponse.json({ msg: "Invalid Form Data" }, { status: 400 });
        const incidentId = formData.get("id") as string || null;
        const communityIncident = formData.get("community") as string || null;
        const sectionIncident = formData.get("section") as string || null;
        const roomIncident = formData.get("room") as string || null;
        const locationIncident = formData.get("location") as string || null;
        const involvedIncident = formData.getAll("involved") as string[];
        const typeIncident = formData.get("type") as string || null;
        const titleIncident = formData.get("title") as string || null;
        const descriptionIncident = formData.get("description") as string || null;
        const dateIncident = formData.get("incidentDate") as string || null;
        const resolvedIncidentRaw = formData.get("resolved");
        const resolvedIncident: boolean | null =
        resolvedIncidentRaw === null ? null : resolvedIncidentRaw === "true";

        const resolvedDateIncidentRaw = formData.get("resolvedDate") as string | null;
        let resolvedDateIncident: Date | undefined;

        if (resolvedDateIncidentRaw) {
        const parsed = new Date(resolvedDateIncidentRaw);
        if (!isNaN(parsed.getTime())) {
            resolvedDateIncident = parsed;
        }
        }
        if(!dateIncident) return NextResponse.json({ msg: "Incident date is required" }, { status: 400 });
        const parsedDate = new Date(dateIncident);
        if (isNaN(parsedDate.getTime())) {
        return NextResponse.json({ msg: "Invalid incident date" }, { status: 400 });
        }


        const user = jwt.verify(token, secretKey) as { userId: string };
        const dbUser = await User.findById(user.userId);
        if (!dbUser) return NextResponse.json({ msg: 'Unauthorized' }, { status: 401 });

        let existingIncident: IncidentLean | null = null;
        if (incidentId) {
            existingIncident = await Incident.findById(incidentId).lean<IncidentLean>();
            
            if (!existingIncident) {
                return NextResponse.json({ msg: "Incident not found" }, { status: 404 });
            }
            if (existingIncident.community !== dbUser.community[0]) {
                return NextResponse.json({ msg: "Unauthorized to edit this incident" }, { status: 403 });
            }
        }

        const room = await Room.find({ community: dbUser.community[0] }).lean<RoomLean[]>();
        const community = await Community.findOne({ community: dbUser.community[0] }).lean<CommunityLean>();
        if (!community) return NextResponse.json({ msg: "Genuine Bad Request. Community doesn't exist" }, { status: 401 });

        if(!typeIncident) return NextResponse.json({ msg: "Incident type is required" }, { status: 400 })

        if (!titleIncident) return NextResponse.json({ msg: "Title is required" }, { status: 400 });

        if (!descriptionIncident) return NextResponse.json({ msg: "Description is required" }, { status: 400 });

        if (!dateIncident) return NextResponse.json({ msg: "Incident date is required" }, { status: 400 });
        
        if (typeIncident === "Policy Violation") {
            if (!roomIncident && !locationIncident) return NextResponse.json({ msg: "A Room or Location is required for Policy Violations" }, { status: 400 });

            if (roomIncident) {
                if (!communityIncident || !sectionIncident) return NextResponse.json({ msg: "If you specify a room, you must specify a community and section" }, { status: 400 });

                if(communityIncident !== dbUser.community[0]) return NextResponse.json({ msg: "Enter your assigned community" }, { status: 400 });
                if(!community.section.some((r: string) => r.toLowerCase() === sectionIncident.toLowerCase())) return NextResponse.json({ msg: "Invalid section" }, { status: 400 });
                
                const findRoom = room.find(doc => doc.section === sectionIncident && doc.room === roomIncident);
                if(!findRoom) return NextResponse.json({ msg: "Invalid Room entry"}, { status: 404 });
            }
        } else if (typeIncident === "Maintenance") {
            if(roomIncident) {
                if (!communityIncident || !sectionIncident) return NextResponse.json({ msg: "Community and Section are required for a Maintenance incident" }, { status: 400 });

            const findRoom = room.find(doc => doc.section.toLowerCase() === sectionIncident.toLowerCase() && doc.room === roomIncident);
                if(!findRoom) return NextResponse.json({ msg: "Invalid Room entry"}, { status: 404 });
            }
            

        } else {
            if (!roomIncident && !locationIncident) return NextResponse.json({ msg: "A Room or Location is required" }, { status: 400 });
            if(communityIncident !== dbUser.community[0]) return NextResponse.json({ msg: "If incident took place outside your assigned community, use the location field only" }, { status: 400 });
        }

        // const newIncident = await Incident.create({
        //     community: communityIncident,
        //     section: sectionIncident,
        //     room: roomIncident,
        //     location: locationIncident,
        //     reporter: dbUser.fullName,
        //     involved: involvedIncident,
        //     type: typeIncident,
        //     title: titleIncident,
        //     description: descriptionIncident,
        //     incidentDate: new Date(dateIncident)
        // } as Partial<IIncident>);
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
            { new: true }
        );
        } else {
        result = await Incident.create({
            community: communityIncident,
            section: sectionIncident,
            room: roomIncident,
            location: locationIncident,
            reporter: dbUser.fullName,
            involved: involvedIncident,
            type: typeIncident,
            title: titleIncident,
            description: descriptionIncident,
            incidentDate: new Date(dateIncident),
        } as Partial<IIncident>);
        }
                return NextResponse.json(
        {
            msg: incidentId
            ? "Incident updated successfully"
            : "Incident created successfully",
            data: result,
        },
        { status: incidentId ? 200 : 201 }
        );
    } catch (error: unknown) {
        return NextResponse.json({ msg: "Internal Server Error" }, { status: 500 });
    }
}

// app/api/incidents/route.ts

export async function DELETE(req: NextRequest) {
  await connectDB();

  const token = req.cookies.get("token")?.value;
          if (!token) {
              return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
          }
          const user = jwt.verify(token, secretKey) as { userId: string };
          const dbUser = await User.findById(user.userId);
          if (!dbUser) return NextResponse.json({ msg: 'Unauthorized' }, { status: 401 });
  const { incidentId } = await req.json();
  const id = incidentId;

  if (!id) {
    return NextResponse.json({ msg: "Incident id is required" }, { status: 400 });
  }

  try {
    const deleted = await Incident.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ msg: "Incident not found" }, { status: 404 });
    }

    return NextResponse.json({ msg: "Incident deleted successfully" }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        msg: "Internal Server Error",
        error: error instanceof Error ? error.message : "Unknown Error",
      },
      { status: 500 },
    );
  }
}

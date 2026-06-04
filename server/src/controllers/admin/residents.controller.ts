import type { Response } from "express";

import { connectDB } from "../../lib/connect.js";

import type { AuthenticatedRequest } from "../../middleware/auth.js";

import {
  listResidents as listResidentsQuery,
  getResidentById,
} from "../../services/housing/residents.service.js";



export async function listResidents(

  req: AuthenticatedRequest,

  res: Response,

): Promise<void> {

  await connectDB();



  const limit = Math.min(Math.max(Number(req.query.limit) || 30, 1), 100);

  const community =

    typeof req.query.community === "string" ? req.query.community : undefined;

  const section =

    typeof req.query.section === "string" ? req.query.section : undefined;

  const q = typeof req.query.q === "string" ? req.query.q.trim() : undefined;

  const cursor =

    typeof req.query.cursor === "string" ? req.query.cursor : undefined;



  const result = await listResidentsQuery({

    limit,

    community,

    section,

    q,

    cursor,

  });



  res.status(200).json({

    msg: "Residents",

    items: result.items,

    nextCursor: result.nextCursor,

  });

}



export async function getResident(

  req: AuthenticatedRequest,

  res: Response,

): Promise<void> {

  await connectDB();

  const resident = await getResidentById(req.params.id);



  if (!resident) {

    res.status(404).json({ msg: "Resident not found" });

    return;

  }



  res.status(200).json({ msg: "Resident detail", resident });

}


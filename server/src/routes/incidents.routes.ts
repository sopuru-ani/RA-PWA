import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as incidentsController from "../controllers/incidents.controller.js";

// Parse multipart/form-data (incident forms use FormData, not JSON)
const upload = multer();

const router = Router();

router.use(requireAuth);

// POST /api/incidents — create or update an incident
router.post(
  "/",
  upload.none(),
  asyncHandler(incidentsController.createOrUpdateIncident),
);

// DELETE /api/incidents — remove an incident by id
router.delete("/", asyncHandler(incidentsController.deleteIncident));

export default router;

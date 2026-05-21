import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as raController from "../controllers/ra.controller.js";

const router = Router();

// All RA routes require a valid session cookie
router.use(requireAuth);

// GET /api/ra/dashboard — dashboard aggregate data
router.get("/dashboard", asyncHandler(raController.getDashboard));

// POST /api/ra/inspections — load inspection session data
router.post("/inspections", asyncHandler(raController.getInspectionSession));

// POST /api/ra/inspections/room-check — save a room check during inspection
router.post(
  "/inspections/room-check",
  asyncHandler(raController.roomCheck),
);

// POST /api/ra/inspections/walkthrough — fetch rooms for a walkthrough session
router.post(
  "/inspections/walkthrough",
  asyncHandler(raController.walkthrough),
);

// POST /api/ra/inspections/all-checked — mark inspection session complete
router.post(
  "/inspections/all-checked",
  asyncHandler(raController.allChecked),
);

export default router;

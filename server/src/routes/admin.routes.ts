import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as adminController from "../controllers/admin.controller.js";

const router = Router();

// POST /api/admin/allowed — add an authorized signup account
router.post("/allowed", asyncHandler(adminController.addAllowedUser));

// POST /api/admin/seed-residents — bulk import residents (Admin only)
router.post(
  "/seed-residents",
  asyncHandler(adminController.seedResidents),
);

export default router;

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as devController from "../controllers/dev.controller.js";

const router = Router();

// Development / seeding utilities (mirror legacy /api/dev/* routes)
router.post("/seed-residents", asyncHandler(devController.seedResidents));
router.post("/seed-rooms", asyncHandler(devController.seedRooms));
router.post("/seed-housing", asyncHandler(devController.seedHousing));
router.post(
  "/seed-section-route",
  asyncHandler(devController.seedSectionRoute),
);

export default router;

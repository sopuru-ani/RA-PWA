import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as dashboardController from "../controllers/sa/dashboard.controller.js";
import * as residentsController from "../controllers/sa/residents.controller.js";
import * as incidentsController from "../controllers/sa/incidents.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("SA"));

router.get("/dashboard", asyncHandler(dashboardController.getDashboard));

router.get("/residents", asyncHandler(residentsController.listResidentsHandler));
router.get("/residents/:id", asyncHandler(residentsController.getResident));

router.get("/incidents", asyncHandler(incidentsController.listIncidents));
router.get("/workspace", asyncHandler(incidentsController.getWorkspace));

export default router;

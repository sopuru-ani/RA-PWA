import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as dashboardController from "../controllers/ga/dashboard.controller.js";
import * as communityController from "../controllers/ga/community.controller.js";
import * as staffController from "../controllers/ga/staff.controller.js";
import * as residentsController from "../controllers/ga/residents.controller.js";
import * as inspectionsController from "../controllers/ga/inspections.controller.js";
import * as incidentsController from "../controllers/ga/incidents.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("GA"));

router.get("/dashboard", asyncHandler(dashboardController.getDashboard));
router.get("/community", asyncHandler(communityController.getCommunity));

router.get("/staff", asyncHandler(staffController.listStaffHandler));
router.get("/staff/:id", asyncHandler(staffController.getStaffById));

router.get("/residents", asyncHandler(residentsController.listResidentsHandler));
router.get("/residents/:id", asyncHandler(residentsController.getResident));
router.post(
  "/resident-requests",
  asyncHandler(residentsController.submitResidentRequest),
);
router.post(
  "/resident-requests/bulk",
  asyncHandler(residentsController.submitBulkResidentRequests),
);
router.get(
  "/resident-requests",
  asyncHandler(residentsController.listMyRequests),
);

router.get(
  "/inspections/walkthroughs",
  asyncHandler(inspectionsController.listWalkthroughs),
);
router.post(
  "/inspections/session",
  asyncHandler(inspectionsController.getInspectionSession),
);
router.post(
  "/inspections/room-check",
  asyncHandler(inspectionsController.roomCheck),
);
router.post(
  "/inspections/walkthrough",
  asyncHandler(inspectionsController.walkthrough),
);
router.post(
  "/inspections/all-checked",
  asyncHandler(inspectionsController.allChecked),
);

router.get("/incidents", asyncHandler(incidentsController.listIncidents));
router.get("/workspace", asyncHandler(incidentsController.getWorkspace));

export default router;

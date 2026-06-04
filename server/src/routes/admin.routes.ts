import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth, requireRole } from "../middleware/auth.js";
import * as dashboardController from "../controllers/admin/dashboard.controller.js";
import * as staffController from "../controllers/admin/staff.controller.js";
import * as communitiesController from "../controllers/admin/communities.controller.js";
import * as residentsController from "../controllers/admin/residents.controller.js";
import * as structureController from "../controllers/admin/structure.controller.js";
import * as legacyAdminController from "../controllers/admin.controller.js";
import * as residentRequestsController from "../controllers/admin/resident-requests.controller.js";
import * as structureManagementController from "../controllers/admin/structure-management.controller.js";

const router = Router();

router.use(requireAuth);
router.use(requireRole("Admin"));

router.get("/dashboard", asyncHandler(dashboardController.getDashboard));

router.get("/staff", asyncHandler(staffController.listStaffHandler));
router.post("/staff", asyncHandler(staffController.createStaff));
router.get("/staff/:id", asyncHandler(staffController.getStaffById));
router.patch("/staff/:id", asyncHandler(staffController.updateStaff));
router.delete("/staff/:id", asyncHandler(staffController.deleteStaff));

// Backward-compatible alias
router.post("/allowed", asyncHandler(staffController.addAllowedUser));

router.get(
  "/communities/options",
  asyncHandler(communitiesController.listCommunityOptions),
);
router.get(
  "/communities",
  asyncHandler(communitiesController.listCommunities),
);
router.post(
  "/communities",
  asyncHandler(structureManagementController.createCommunityHandler),
);
router.get(
  "/communities/:community/sections",
  asyncHandler(structureManagementController.getSectionSummariesHandler),
);
router.post(
  "/communities/:community/sections",
  asyncHandler(structureManagementController.addSectionHandler),
);
router.patch(
  "/communities/:community/sections/:section",
  asyncHandler(structureManagementController.renameSectionHandler),
);
router.delete(
  "/communities/:community/sections/:section",
  asyncHandler(structureManagementController.deleteSectionHandler),
);
router.get(
  "/communities/:community/rooms",
  asyncHandler(structureManagementController.listRoomsHandler),
);
router.post(
  "/communities/:community/rooms/bulk",
  asyncHandler(structureManagementController.createRoomsBulkHandler),
);
router.post(
  "/communities/:community/rooms",
  asyncHandler(structureManagementController.createRoomHandler),
);
router.patch(
  "/communities/:community/rooms/:roomId",
  asyncHandler(structureManagementController.updateRoomHandler),
);
router.delete(
  "/communities/:community/rooms/:roomId",
  asyncHandler(structureManagementController.deleteRoomHandler),
);
router.patch(
  "/communities/:community",
  asyncHandler(structureManagementController.renameCommunityHandler),
);
router.delete(
  "/communities/:community",
  asyncHandler(structureManagementController.deleteCommunityHandler),
);
router.get(
  "/communities/:community",
  asyncHandler(communitiesController.getCommunity),
);

router.get("/residents", asyncHandler(residentsController.listResidents));
router.get(
  "/residents/:id",
  asyncHandler(residentsController.getResident),
);
router.patch(
  "/residents/:id",
  asyncHandler(residentsController.updateResident),
);
router.delete(
  "/residents/:id",
  asyncHandler(residentsController.deleteResident),
);
router.post(
  "/residents/:id/move",
  asyncHandler(residentsController.moveResident),
);

router.get("/structure", asyncHandler(structureController.getStructure));

router.get(
  "/resident-requests",
  asyncHandler(residentRequestsController.listPendingRequests),
);
router.get(
  "/resident-requests/:id",
  asyncHandler(residentRequestsController.getRequest),
);
router.post(
  "/resident-requests/:id/approve",
  asyncHandler(residentRequestsController.approveRequest),
);
router.post(
  "/resident-requests/:id/reject",
  asyncHandler(residentRequestsController.rejectRequest),
);

router.post(
  "/seed-residents",
  asyncHandler(legacyAdminController.seedResidents),
);

export default router;

import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { requireAuth } from "../middleware/auth.js";
import * as programsController from "../controllers/programs.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", asyncHandler(programsController.getProgramStats));
router.get("/monitoring", asyncHandler(programsController.listMonitoringPrograms));
router.get("/pending", asyncHandler(programsController.listPendingApproval));
router.get("/calendar", asyncHandler(programsController.getCalendar));
router.get("/conflicts", asyncHandler(programsController.getConflicts));
router.post(
  "/reminders/send",
  asyncHandler(programsController.sendReminders),
);
router.get("/", asyncHandler(programsController.listPrograms));
router.post("/", asyncHandler(programsController.createProgram));

router.get("/:id", asyncHandler(programsController.getProgram));
router.patch("/:id", asyncHandler(programsController.updateProgram));
router.post("/:id/submit", asyncHandler(programsController.submitForApproval));
router.post("/:id/publish", asyncHandler(programsController.publishProgram));
router.post("/:id/approve", asyncHandler(programsController.approveProgram));
router.post("/:id/reject", asyncHandler(programsController.rejectProgram));
router.post("/:id/cancel", asyncHandler(programsController.cancelProgram));
router.patch("/:id/rsvp", asyncHandler(programsController.updateRsvp));
router.get(
  "/:id/attendance/export",
  asyncHandler(programsController.exportAttendance),
);
router.get("/:id/attendance", asyncHandler(programsController.getAttendance));
router.patch("/:id/attendance", asyncHandler(programsController.updateAttendance));
router.post("/:id/attachments", asyncHandler(programsController.addAttachment));
router.delete(
  "/:id/attachments/:attachmentId",
  asyncHandler(programsController.removeAttachment),
);

export default router;

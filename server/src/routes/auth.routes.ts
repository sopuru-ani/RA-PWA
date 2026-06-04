import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as authController from "../controllers/auth.controller.js";

const router = Router();

// POST /api/auth/login — authenticate and set httpOnly JWT cookie
router.post("/login", asyncHandler(authController.login));

// POST /api/auth/signup — register an authorized user
router.post("/signup", asyncHandler(authController.signup));

// POST /api/auth/verify-email - verifies that an email can signup
router.post("/verify-email", asyncHandler(authController.verifyEmail));

// GET /api/auth/signup — debug lookup (legacy behavior)
router.get("/signup", asyncHandler(authController.signupDebugGet));

// POST /api/auth/logout — clear session cookie
router.post("/logout", asyncHandler(authController.logout));

// GET /api/auth/verify — return current user from cookie JWT
router.get("/verify", asyncHandler(authController.verify));

export default router;

import { Router } from "express";
import authRoutes from "./auth.routes.js";
import incidentsRoutes from "./incidents.routes.js";
import raRoutes from "./ra.routes.js";
import adminRoutes from "./admin.routes.js";
import gaRoutes from "./ga.routes.js";
import saRoutes from "./sa.routes.js";
import devRoutes from "./dev.routes.js";

/**
 * Mount all API routers under /api to match the original Next.js route paths.
 * Example: auth login → POST /api/auth/login
 */
const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/incidents", incidentsRoutes);
apiRouter.use("/ra", raRoutes);
apiRouter.use("/admin", adminRoutes);
apiRouter.use("/ga", gaRoutes);
apiRouter.use("/sa", saRoutes);
apiRouter.use("/dev", devRoutes);

export default apiRouter;

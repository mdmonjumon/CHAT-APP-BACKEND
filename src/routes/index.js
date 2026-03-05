import express from "express";
import { AuthRoutes } from "../modules/auth/auth.routes.js";
import verifyToken from "../middleware/verifyToken.js";
import { UserRoute } from "../modules/user/user.routes.js";
import { messageRoute } from "../modules/message/message.routes.js";

const router = express.Router();

router.use(verifyToken);

const modulesRoutes = [
  {
    path: "/auth",
    route: AuthRoutes,
  },
  {
    path: "/allUsers",
    route: UserRoute,
  },
  {
    path: "/message",
    route: messageRoute,
  },
];

modulesRoutes.forEach((route) => router.use(route.path, route.route));

export default router;

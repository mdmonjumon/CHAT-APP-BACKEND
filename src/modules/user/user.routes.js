import express from "express";
import { userController } from "./user.controller.js";

const router = express.Router();

router.get("/users", userController.allUsers);

export const UserRoute = router;

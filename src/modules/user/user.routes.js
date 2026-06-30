import express from "express";
import { userController } from "./user.controller.js";

const router = express.Router();

router.get("/users", userController.allUsers);
router.patch("/update-profile", userController.updateProfile);

export const UserRoute = router;

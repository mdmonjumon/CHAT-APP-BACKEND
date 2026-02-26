import express from "express";
import { authController } from "./auth.controller.js";


const router = express.Router();

router.post("/signup", authController.signupUserIntoDB);

export const AuthRoutes = router;

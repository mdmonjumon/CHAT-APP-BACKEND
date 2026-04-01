import express from "express";
import { messageController } from "./message.controller.js";

const router = express.Router();

router.post(
  "/getOrCreateConversation",
  messageController.getOrCreateConversation,
);
router.post("/create-group", messageController.createGroup)
router.post("/send", messageController.sendMessage);
router.get("/:conversationId", messageController.getMessage);

export const messageRoute = router;

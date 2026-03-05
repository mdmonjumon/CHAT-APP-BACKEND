
import { io } from "../../server.js";
import { messageServices } from "./message.services.js";

const getOrCreateConversation = async (req, res) => {
  try {
    const { receiverId } = req?.body;
    const senderId = req?.user?._id;
    const result = await messageServices.getOrCreateConversation(
      senderId,
      receiverId,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching conversation" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { message: text, conversationId } = req.body;
    const senderId = req?.user?._id;

    if (!text || !conversationId) {
      return res.status(400).json({ error: "Invalid message data" });
    }
    const result = await messageServices.sendMessage({
      text,
      conversationId,
      senderId,
    });

    // SOCKET.IO
    io.to(conversationId).emit("receive_message", result);

    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMessage = async (req, res) => {
  try {
    const { conversationId } = req.params;

    // চেক করা আইডি পাঠানো হয়েছে কি না
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }
    const messages = await messageServices.getMessage(conversationId);
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const messageController = {
  getOrCreateConversation,
  sendMessage,
  getMessage,
};

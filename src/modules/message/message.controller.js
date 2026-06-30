import { io } from "../../server.js";
import { messageServices } from "./message.services.js";

// one to one conversation
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

// create group conversation
const createGroup = async (req, res) => {
  try {
    const { chatName, participants } = req.body;
    const adminId = req.user._id;

    const result = await messageServices.createGroup({
      chatName,
      participants,
      adminId,
    });

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

const sendMessage = async (req, res) => {
  try {
    const { message: text, conversationId, messageType, image, fileUrl } = req.body;
    const senderId = req?.user?._id;

    if ((!text && !image && !fileUrl) || !conversationId) {
      return res.status(400).json({ error: "Invalid message data" });
    }
    const result = await messageServices.sendMessage({
      text,
      conversationId,
      senderId,
      messageType,
      image,
      fileUrl,
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

const getUserGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const groups = await messageServices.getUserGroups(userId);
    res.status(200).json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const messageController = {
  getOrCreateConversation,
  sendMessage,
  getMessage,
  createGroup,
  getUserGroups,
};

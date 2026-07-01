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
    const { limit, before } = req.query;
    const userId = req?.user?._id;

    // চেক করা আইডি পাঠানো হয়েছে কি না
    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: "Conversation ID is required",
      });
    }
    const messages = await messageServices.getMessage(conversationId, userId, limit, before);
    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    const isAccessDenied = error.message && error.message.includes("access denied");
    res.status(isAccessDenied ? 403 : 500).json({
      success: false,
      message: isAccessDenied ? "Access denied: you are not a participant of this conversation." : "Internal server error",
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

const updateGroup = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { chatName, groupProfilePic } = req.body;
    const userId = req?.user?._id;

    const updateData = {};
    if (chatName) updateData.chatName = chatName;
    if (groupProfilePic !== undefined) updateData.groupProfilePic = groupProfilePic;

    const result = await messageServices.updateGroup(conversationId, userId, updateData);

    // Socket broadcast update (or simply success response)
    // We can emit a socket update so all connected users receive the name/pic change
    io.to(conversationId).emit("group_updated", result);

    res.status(200).json({
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

const makeAdmin = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { newAdminId } = req.body;
    const adminId = req?.user?._id;

    if (!newAdminId) {
      return res.status(400).json({ success: false, message: "New admin user ID is required" });
    }

    const result = await messageServices.makeAdmin(conversationId, adminId, newAdminId);

    // Socket broadcast update to update frontend layouts
    io.to(conversationId).emit("group_updated", result);

    res.status(200).json({
      success: true,
      data: result,
      message: "Admin role transferred successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const markAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req?.user?._id;

    await messageServices.markAsRead(conversationId, userId);

    // Broadcast messages_read event to the room
    io.to(conversationId).emit("messages_read", { conversationId, userId });

    res.status(200).json({
      success: true,
      message: "Messages marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateGroupMembers = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { targetUserId, action } = req.body; // action is 'add' or 'remove'
    const adminId = req?.user?._id;

    if (!targetUserId || !action) {
      return res.status(400).json({ success: false, message: "targetUserId and action are required" });
    }

    const { conversation, systemMessage } = await messageServices.updateGroupMembers(
      conversationId,
      adminId,
      targetUserId,
      action
    );

    // Broadcast update events to group chat
    io.to(conversationId).emit("group_updated", conversation);
    io.to(conversationId).emit("receive_message", systemMessage);

    res.status(200).json({
      success: true,
      data: conversation,
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
  updateGroup,
  makeAdmin,
  markAsRead,
  updateGroupMembers,
};

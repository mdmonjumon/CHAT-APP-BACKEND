import mongoose from "mongoose";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";
import User from "../../models/User.js";

// create one to one conversation
const getOrCreateConversation = async (senderId, receiverId) => {
  // ১. চেক করা এই দুজনের মধ্যে আগে কোনো রুম হয়েছে কি না
  let conversation = await Conversation.findOne({
    isGroupChat: false,
    participants: { $all: [senderId, receiverId] },
  });

  // ২. যদি না থাকে, তবে নতুন রুম তৈরি করা
  if (!conversation) {
    conversation = await Conversation.create({
      participants: [senderId, receiverId],
    });
  }

  // ৩. মেম্বারদের ডিটেইলসসহ রিটার্ন করা (যাতে ফ্রন্টএন্ডে ছবি/নাম দেখানো যায়)
  return await conversation.populate(
    "participants",
    "fullName profilePic isOnline",
  );
};

// create group conversation
const createGroup = async (groupData) => {
  try {
    const { chatName, participants, adminId } = groupData;

    // ১. সব আইডিকে ObjectId-এ কনভার্ট করা (যাতে ফরম্যাট একই থাকে)
    const formattedParticipants = participants.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    // ২. এডমিনকেও ObjectId হিসেবে যোগ করা
    const adminObjectId = new mongoose.Types.ObjectId(adminId);

    // ৩. ডুপ্লিকেট রিমুভ করা (Set ব্যবহার করে)
    const uniqueParticipants = [
      ...new Set([
        ...formattedParticipants.map((id) => id.toString()),
        adminObjectId.toString(),
      ]),
    ].map((id) => new mongoose.Types.ObjectId(id));

    const newGroupData = {
      participants: uniqueParticipants,
      isGroupChat: true,
      chatName,
      groupAdmin: adminObjectId,
    };

    const result = await Conversation.create(newGroupData);
    return await result.populate("participants", "fullName profilePic");
  } catch (error) {
    console.error("Database Error in createGroupService:", error);
    throw new Error("Failed to create group. Please check your data.");
  }
};

const sendMessage = async (payload) => {
  const { text, senderId, conversationId, messageType, image, fileUrl } = payload;

  // ১. সেশন শুরু করা
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ২. কনভারসেশন চেক করা (সেশনের ভেতরে)
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    }).session(session);

    if (!conversation) {
      throw new Error("Conversation not found or access denied!");
    }

    // ৩. মেসেজ তৈরি করা (সেশনের ভেতরে)
    const [newMessage] = await Message.create(
      [
        {
          conversationId,
          senderId,
          text,
          messageType: messageType || "text",
          image,
          fileUrl,
          readBy: [senderId],
        },
      ],
      { session },
    );

    // ৪. কনভারসেশনের 'lastMessage' আপডেট করা (সেশনের ভেতরে)
    await Conversation.findByIdAndUpdate(
      conversationId,
      { lastMessage: newMessage._id },
      { session },
    );

    // ৫.  ঠিক থাকলে ডাটাবেসে পার্মানেন্টলি সেভ করা
    await session.commitTransaction();
    session.endSession();

    return await newMessage.populate(
      "senderId",
      "fullName profilePic firebaseUid",
    );
  } catch (error) {
    // যদি কোনো একটি ধাপে এরর হয়, তবে পুরো কাজ বাতিল (Rollback) হবে
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const getMessage = async (conversationId, limit = 30, before = null) => {
  const query = { conversationId };
  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  const messages = await Message.find(query)
    .populate("senderId", "fullName profilePic email firebaseUid")
    .sort({ createdAt: -1 })
    .limit(Number(limit));

  return messages.reverse();
};

const getUserGroups = async (userId) => {
  const groups = await Conversation.find({
    participants: userId,
    isGroupChat: true,
  })
    .populate("participants", "fullName profilePic firebaseUid email isOnline")
    .populate({
      path: "lastMessage",
      populate: {
        path: "senderId",
        select: "fullName profilePic",
      },
    })
    .sort({ updatedAt: -1 });

  return groups;
};

const updateGroup = async (conversationId, userId, updateData) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
    isGroupChat: true,
  });

  if (!conversation) {
    throw new Error("Group chat not found or access denied!");
  }

  const result = await Conversation.findByIdAndUpdate(
    conversationId,
    updateData,
    { new: true }
  ).populate("participants", "fullName profilePic");

  return result;
};

const makeAdmin = async (conversationId, adminId, newAdminId) => {
  // Find conversation and ensure requesting user is the current admin
  const conversation = await Conversation.findOne({
    _id: conversationId,
    groupAdmin: adminId,
    isGroupChat: true,
  });

  if (!conversation) {
    throw new Error("Group chat not found or you are not the group admin!");
  }

  // Ensure new admin is a participant
  const isParticipant = conversation.participants.some(
    (pId) => pId.toString() === newAdminId.toString()
  );

  if (!isParticipant) {
    throw new Error("New admin must be a participant of the group!");
  }

  const result = await Conversation.findByIdAndUpdate(
    conversationId,
    { groupAdmin: new mongoose.Types.ObjectId(newAdminId) },
    { new: true }
  ).populate("participants", "fullName profilePic");

  return result;
};

const markAsRead = async (conversationId, userId) => {
  const result = await Message.updateMany(
    {
      conversationId,
      senderId: { $ne: userId },
      readBy: { $ne: userId },
    },
    {
      $addToSet: { readBy: userId },
    }
  );
  return result;
};

const updateGroupMembers = async (conversationId, adminId, targetUserId, action) => {
  // Check if conversation exists and requester is the admin
  const conversation = await Conversation.findOne({
    _id: conversationId,
    groupAdmin: adminId,
    isGroupChat: true,
  });

  if (!conversation) {
    throw new Error("Group chat not found or you are not the group admin!");
  }

  const targetObjectId = new mongoose.Types.ObjectId(targetUserId);

  let updateQuery = {};
  if (action === "add") {
    updateQuery = { $addToSet: { participants: targetObjectId } };
  } else if (action === "remove") {
    // Cannot remove the admin themselves
    if (conversation.groupAdmin.toString() === targetUserId.toString()) {
      throw new Error("Cannot remove the admin from the group. Transfer admin first.");
    }
    updateQuery = { $pull: { participants: targetObjectId } };
  } else {
    throw new Error("Invalid action. Must be 'add' or 'remove'.");
  }

  const result = await Conversation.findByIdAndUpdate(
    conversationId,
    updateQuery,
    { new: true }
  ).populate("participants", "fullName profilePic firebaseUid email");

  // Create a system message logging the action
  const requester = await User.findById(adminId);
  const targetUser = await User.findById(targetUserId);
  const actionText = action === "add" 
    ? `${requester.fullName} added ${targetUser.fullName} to the group` 
    : `${requester.fullName} removed ${targetUser.fullName} from the group`;

  const [systemMessage] = await Message.create([
    {
      conversationId,
      senderId: adminId,
      text: actionText,
      messageType: "system",
      readBy: [adminId],
    }
  ]);

  const populatedSystemMessage = await systemMessage.populate(
    "senderId",
    "fullName profilePic firebaseUid"
  );

  return { conversation: result, systemMessage: populatedSystemMessage };
};

export const messageServices = {
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

import mongoose from "mongoose";
import Conversation from "../../models/Conversation.js";
import Message from "../../models/Message.js";

// create one to one conversation
const getOrCreateConversation = async (senderId, receiverId) => {
  // ১. চেক করা এই দুজনের মধ্যে আগে কোনো রুম হয়েছে কি না
  let conversation = await Conversation.findOne({
    isGroupChat: false,
    participants: { $all: [senderId, receiverId] },
  });

  // ২. যদি না থাকে, তবে নতুন রুম তৈরি করা
  if (!conversation) {
    conversation = Conversation.create({
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
  const { text, senderId, conversationId } = payload;

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

    // ৫. সবকিছু ঠিক থাকলে ডাটাবেসে পার্মানেন্টলি সেভ করা
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

const getMessage = async (conversationId) => {
  const messages = await Message.find({ conversationId })
    .populate("senderId", "fullName profilePic email firebaseUid")
    .sort({ createdAt: 1 });

  return messages;
};

export const messageServices = {
  getOrCreateConversation,
  sendMessage,
  getMessage,
  createGroup,
};

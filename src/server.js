import { createServer } from "http";
import app from "./app.js";
import connectDb from "./config/db.js";
import config from "./config/env.js";
import { Server } from "socket.io";
import User from "./models/User.js";
import Conversation from "./models/Conversation.js";

const port = config.port;

//Express app কে HTTP সার্ভারে রূপান্তর

const httpServer = createServer(app);

// সকেট সার্ভার সেটআপ
const io = new Server(httpServer, {
  cors: {
    origin: config.client_link,
    credentials: true,
  },
});

const onlineUsers = new Map();
// সকেট কানেকশন হ্যান্ডেল করা
io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  // চ্যাট রুমে জয়েন করা
  socket.on("join_room", async (conversationId) => {
    try {
      const firebaseUid = socket.userId;
      if (!firebaseUid) {
        console.log("No firebaseUid attached to socket, join_room denied");
        return;
      }

      const userDoc = await User.findOne({ firebaseUid });
      if (!userDoc) {
        console.log("User not found for firebaseUid", firebaseUid);
        return;
      }

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userDoc._id,
      });

      if (!conversation) {
        console.log(`Access denied: User ${userDoc.fullName} is not a participant of conversation ${conversationId}`);
        return;
      }

      socket.join(conversationId);
      console.log(`User ${userDoc.fullName} joined room: ${conversationId}`);
    } catch (err) {
      console.error("Error in join_room:", err.message);
    }
  });

  // টাইপিং ইন্ডিকেটর হ্যান্ডেল করা
  socket.on("typing", ({ conversationId, userId, fullName }) => {
    socket.to(conversationId).emit("user_typing", { conversationId, userId, fullName });
  });

  socket.on("stop_typing", ({ conversationId, userId }) => {
    socket.to(conversationId).emit("user_stop_typing", { conversationId, userId });
  });

  socket.on("setup", (userId) => {
    if (!userId) return;

    socket.userId = userId; // store firebaseUid on socket
    socket.join(userId);
    onlineUsers.set(userId, socket.id);

    // অনলাইন ইউজারদের আইডি অ্যারে হিসেবে পাঠানো
    io.emit("get_online_users", Array.from(onlineUsers.keys()));
    console.log(`✅ User ${userId} is online`);
  });

  socket.on("disconnect", () => {
    let disconnectedUserId;
    for (let [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        disconnectedUserId = userId;
        break;
      }
    }

    if (disconnectedUserId) {
      onlineUsers.delete(disconnectedUserId);
      io.emit("get_online_users", Array.from(onlineUsers.keys()));
    }
  });
});

connectDb();

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export { io };

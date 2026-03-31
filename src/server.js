import { createServer } from "http";
import app from "./app.js";
import connectDb from "./config/db.js";
import config from "./config/env.js";
import { Server } from "socket.io";

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
  socket.on("join_room", (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  socket.on("setup", (userId) => {
    if (!userId) return;

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

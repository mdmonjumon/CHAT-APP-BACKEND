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

// সকেট কানেকশন হ্যান্ডেল করা
io.on("connection", (socket) => {
  console.log("user connected", socket.id);

  // চ্যাট রুমে জয়েন করা
  socket.on("join_room", (conversationId) => {
    socket.join(conversationId);
    console.log(`User joined room: ${conversationId}`);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

connectDb();

httpServer.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

export { io };

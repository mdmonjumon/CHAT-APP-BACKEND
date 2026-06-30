# Chatly Server — Real-Time Chat Application Backend

This is the backend server for **Chatly**, a real-time messaging application. Built with Node.js, Express, Socket.io, and Mongoose, this server handles authentication verification, message persistence, real-time events, group administration actions, read tracking, and database pagination.

## 🚀 Key Features

*   **⚡ Real-Time WebSockets**: Handles instant one-to-one messaging, live typing events, read statuses, and group metadata updates using Socket.io.
*   **👥 Group Chat Management**: Implements services for group creation, administrator privilege transfers, adding/removing members, and system log messaging.
*   **🔑 Secure Route Protection**: Middlewares to decode and verify Firebase user ID tokens, linking them dynamically with MongoDB database records.
*   **📂 Database Persistence**: Transactional message saving (using Mongoose sessions) to ensure atomicity across message creations and conversation updates.
*   **📈 Cursor-Based Pagination**: API pagination limiting queries to 30 documents and fetching preceding messages using timestamp pagination to guarantee scaling performance.
*   **✓✓ Message Read Tracking**: DB actions to track readers (`readBy` array) and broadcast read actions to room members dynamically.

---

## 🛠️ Tech Stack

*   **Runtime**: [Node.js](https://nodejs.org/)
*   **Framework**: [Express.js](https://expressjs.com/)
*   **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/)
*   **Real-time engine**: [Socket.io](https://socket.io/)
*   **Environment management**: [dotenvx](https://dotenvx.com/)
*   **Process supervisor**: [Nodemon](https://nodemon.io/)

---

## 📁 Directory Structure

```text
src/
├── config/        # Database and configuration files
├── middlewares/   # Auth verification middlewares
├── models/        # Mongoose database schemas (User, Conversation, Message)
├── modules/       # Modular features containing services, controllers, and routes
│   ├── user/      # User management endpoints
│   └── message/   # Chat messaging and group operations
└── server.js      # App startup and WebSocket events bootstrap
```

---

## ⚙️ Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/mdmonjumon/CHAT-APP-BACKEND.git
    cd CHAT-APP-BACKEND
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the root directory and define the following variables:
    ```env
    PORT=3001
    MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The server will start running locally at `http://localhost:3001` and connect to MongoDB.

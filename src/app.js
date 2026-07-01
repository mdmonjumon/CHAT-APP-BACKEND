import express from "express";
import router from "./routes/index.js";
import cors from "cors";
import dotenv from "dotenv";
import config from "./config/env.js";

dotenv.config();
const app = express();

app.use(
  cors({
    origin: config.client_link,
    credentials: true,
  }),
);

app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.use("/api/v1", router);

export default app;

import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  connecting_str: process.env.CONNECTING_STR,
  port: process.env.PORT,
  client_link:process.env.CLIENT_SITE_URL
};

export default config;

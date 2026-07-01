import admin from "firebase-admin";
import { readFileSync } from "fs";

let serviceAccount;

if (process.env.FIREBASE_CREDENTIALS) {
  try {
    serviceAccount = JSON.parse(process.env.FIREBASE_CREDENTIALS);
  } catch (error) {
    console.error("Failed to parse FIREBASE_CREDENTIALS env variable:", error.message);
    process.exit(1);
  }
} else {
  try {
    serviceAccount = JSON.parse(
      readFileSync(
        new URL("../../chat-application-firebase.json", import.meta.url),
      ),
    );
  } catch (error) {
    console.error("Failed to load local chat-application-firebase.json file:", error.message);
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin;

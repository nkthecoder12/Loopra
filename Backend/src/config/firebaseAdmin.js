const admin = require("firebase-admin");

let messaging = null;
let initialized = false;

try {
  const apps = admin.apps || [];
  if (apps.length === 0) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKeyEnv = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && privateKeyEnv) {
      // Correct for stringified multiline formatting in environment variables
      const privateKey = privateKeyEnv.replace(/\\n/g, "\n");

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      console.log("[Firebase Admin] Initialized successfully.");
      initialized = true;
    } else {
      console.warn(
        "[Firebase Admin] Missing credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY). FCM will run in fallback/offline mode."
      );
    }
  } else {
    initialized = true;
  }

  if (initialized) {
    messaging = admin.messaging();
  }
} catch (error) {
  console.error("[Firebase Admin] Initialization failed:", error.message);
}

module.exports = {
  admin,
  messaging,
  isAvailable: () => initialized && messaging !== null,
};

# Firebase Cloud Messaging (FCM) Integration Guide

This guide documents the setup, environment variables, credentials configuration, and troubleshooting steps required for production deployment of Firebase Cloud Messaging (FCM) in **Loopra**.

---

## 1. Firebase Project Setup

### A. Create Project
1. Visit the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project**, name it `Loopra`, and click **Create**.
3. Choose whether to enable Google Analytics (optional, click continue).

### B. Obtain Server Credentials (Service Account)
1. Go to the project settings by clicking the gear icon ⚙️ next to "Project Overview" and selecting **Project settings**.
2. Navigate to the **Service accounts** tab.
3. Click **Generate new private key** -> **Generate key**.
4. Save the downloaded JSON file locally. The values from this file will be added to your Backend `.env` file (see Section 2).

### C. Create Web App & Obtain VAPID Credentials
1. Under **Project settings** -> **General** tab, scroll down to "Your apps" and click the web icon `</>` to register a web app.
2. Name the app `Loopra Web` and click **Register app**.
3. Copy the `firebaseConfig` object properties for your Frontend `.env` variables.
4. Navigate to the **Cloud Messaging** tab.
5. Under **Web configuration**, scroll to "Web Push certificates" and click **Generate key pair**.
6. Copy the generated VAPID Key. This is your VAPID public key.

---

## 2. Environment Variables Setup

### Backend Environment Variables (`Backend/.env`)
Set these environment keys using the values from your downloaded private key JSON file:
```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDh...\n-----END PRIVATE KEY-----\n"
```
*Note: Make sure to replace newline characters inside the private key string with `\n` to prevent parsing issues.*

### Frontend Environment Variables (`Frontend/.env`)
Set these using the credentials from your Firebase web app config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY="AIzaSyA..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project-id.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="xxxxxxxxxxxx"
NEXT_PUBLIC_FIREBASE_APP_ID="1:xxxxxxxxxxxx:web:xxxxxxxxxxxx"
NEXT_PUBLIC_FIREBASE_VAPID_KEY="Bxxxxx-your-vapid-public-key-xxxxx"
```

---

## 3. Architecture & Source Files

### Backend Components
1. **Model:** [DeviceToken.js](file:///c:/Loopra-main/Backend/src/models/DeviceToken.js)
   Stores token-user mappings along with browser, OS, and permission status metrics. Inactive tokens are auto-deleted after 30 days via a MongoDB TTL index.
2. **Initializer:** [firebaseAdmin.js](file:///c:/Loopra-main/Backend/src/config/firebaseAdmin.js)
   Initializes the Admin SDK singleton using the certified variables. Falls back to offline-mock mode if credentials are not configured in local development.
3. **Providers Interface:**
   - [socketProvider.js](file:///c:/Loopra-main/Backend/src/services/providers/socketProvider.js): Wraps Socket.IO.
   - [firebaseProvider.js](file:///c:/Loopra-main/Backend/src/services/providers/firebaseProvider.js): Wraps FCM and messaging individual dispatches with backoff retry checks (`1s` -> `2s` -> `5s`). Automatically flags unregistered/invalid tokens as inactive.
4. **Router & Controller:** [notificationRoutes.js](file:///c:/Loopra-main/Backend/src/routes/notificationRoutes.js) / [notificationController.js](file:///c:/Loopra-main/Backend/src/controllers/notificationController.js)
   Endpoints to register, deregister, and list devices.

### Frontend Components
1. **Service Worker:** [firebase-messaging-sw.js](file:///c:/Loopra-main/Frontend/public/firebase-messaging-sw.js)
   Listens for background push notifications, shows branded icons and badges, and manages tab-focusing navigation.
2. **Manager:** [FirebaseNotificationManager.tsx](file:///c:/Loopra-main/Frontend/src/components/FirebaseNotificationManager.tsx)
   React component rendering the consensual two-step UI prompt, registering tokens, deduplicating incoming messages against a 50-item cache, and cleaning up tokens on logout.

---

## 4. Testing & Verification

### Automated Mocks Test
You can execute verification tests for backend retries and invalid token deactivations directly from your console:
```bash
cd Backend
node src/scripts/verifyFCM.js
```
Expected output logs:
- `[SUCCESS] Invalid token was marked isActive = false. (Permission: denied)`
- `[SUCCESS] Backoff retry executed exactly 3 times before succeeding.`
- `[SUCCESS] Notification analytics populated: pushDelivered: true`

---

## 5. Troubleshooting & FAQ

### Browser Blocks Autoplay / Desktop Prompts
- Browser notification permissions can only be requested after a direct user action (like clicking the "Enable" button on the Loopra banner prompt). The manager component respects this and never blocks page load with a sudden prompt.
- If you block notifications, you must clear permission settings in the browser site info panel (clicking the slider icon next to the URL) to reset notifications permission.

### Service Worker Issues (Multiple Service Workers)
- Next.js sometimes caches service workers. If you make updates to `/firebase-messaging-sw.js`, force refresh the browser (`Ctrl+F5`) or unregister old workers in Chrome Developer Tools (`Application` -> `Service Workers`).

### Private Key Parsing Failure
- Ensure `FIREBASE_PRIVATE_KEY` wraps newline chars as `\n` without actual carriage returns if loading in Docker or generic hosting panels.

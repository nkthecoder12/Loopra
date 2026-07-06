"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { messaging } from "@/lib/firebase";
import { getToken, onMessage } from "firebase/messaging";
import { useAuthStore } from "@/store/useAuthStore";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useNotificationCenterStore } from "@/store/useNotificationCenterStore";
import { motion, AnimatePresence } from "framer-motion";
import { BellRing, X } from "lucide-react";
import api from "@/lib/api";

const DEDUPLICATION_LIMIT = 50;

export function FirebaseNotificationManager() {
  const { isAuthenticated, token } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const { fetchUnreadCount, fetchNotifications } = useNotificationCenterStore();

  const [showPrompt, setShowPrompt] = useState(false);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  
  const processedIdsRef = useRef<string[]>([]);
  const hasRegisteredRef = useRef<boolean>(false);

  // Parse basic browser agent details for metadata registration
  const getDeviceMetadata = useCallback(() => {
    if (typeof window === "undefined") return { browser: "Unknown", os: "Unknown" };

    const ua = navigator.userAgent;
    let browser = "Unknown Browser";
    let os = "Unknown OS";

    if (ua.includes("Windows")) os = "Windows";
    else if (ua.includes("Macintosh") || ua.includes("Mac OS")) os = "macOS";
    else if (ua.includes("Android")) os = "Android";
    else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
    else if (ua.includes("Linux")) os = "Linux";

    if (ua.includes("Chrome") && !ua.includes("Chromium") && !ua.includes("Edg")) browser = "Chrome";
    else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
    else if (ua.includes("Firefox")) browser = "Firefox";
    else if (ua.includes("Edg")) browser = "Edge";

    return { browser, os };
  }, []);

  const osDetect = useCallback((os: string) => {
    if (os === "iOS") return "ios";
    if (os === "Android") return "android";
    return "web";
  }, []);

  // 1. Token Registration Routine
  const registerPushNotifications = useCallback(async () => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !messaging) {
      console.warn("FCM Push Notifications are not supported in this browser.");
      return;
    }

    try {
      // 1. Register Service Worker with dynamic config query params
      const configParams = new URLSearchParams({
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
      }).toString();

      const swReg = await navigator.serviceWorker.register(
        `/firebase-messaging-sw.js?${configParams}`
      );

      // 2. Request permission if not already granted
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission denied by user.");
        return;
      }

      // 3. Obtain Firebase Messaging device token
      const tokenVal = await getToken(messaging, {
        serviceWorkerRegistration: swReg,
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!tokenVal) {
        console.warn("No token returned from Firebase.");
        return;
      }

      setFcmToken(tokenVal);

      // Save token to backend API if not already registered in this session
      if (!hasRegisteredRef.current) {
        const metadata = getDeviceMetadata();
        await api.post("/notifications/device-token", {
          deviceToken: tokenVal,
          platform: "web",
          browser: metadata.browser,
          os: osDetect(metadata.os),
          notificationPermission: permission,
        });
        hasRegisteredRef.current = true;
        console.log("[FCM Manager] Token registered successfully.");
      }
    } catch (err) {
      console.error("[FCM Manager] Registration failure:", err);
    }
  }, [getDeviceMetadata, osDetect]);

  // 2. Two-Step Permission Prompt Logic
  useEffect(() => {
    if (!isAuthenticated) return;

    if (typeof window !== "undefined" && "Notification" in window) {
      const permission = Notification.permission;
      const dismissedTime = localStorage.getItem("loopra_push_dismissed");
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      const isRecentlyDismissed =
        dismissedTime && Date.now() - parseInt(dismissedTime) < oneWeek;

      if (permission === "default" && !isRecentlyDismissed) {
        const timer = setTimeout(() => setShowPrompt(true), 3000);
        return () => clearTimeout(timer);
      } else if (permission === "granted") {
        setTimeout(() => {
          registerPushNotifications();
        }, 0);
      }
    }
  }, [isAuthenticated, registerPushNotifications]);

  const handleAcceptPermission = async () => {
    setShowPrompt(false);
    await registerPushNotifications();
  };

  const handleDismissPermission = () => {
    setShowPrompt(false);
    localStorage.setItem("loopra_push_dismissed", Date.now().toString());
  };

  // 3. Hook Foreground Messages & De-duplicate against Socket IO
  useEffect(() => {
    if (!messaging || !isAuthenticated) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log("[FCM Manager] Received foreground payload:", payload);

      const notifId = payload.data?.notificationId;
      if (!notifId) return;

      // Duplicate prevention check
      if (processedIdsRef.current.includes(notifId)) {
        console.log(`[FCM Manager] Suppressed duplicate alert: ${notifId}`);
        return;
      }

      processedIdsRef.current.push(notifId);
      if (processedIdsRef.current.length > DEDUPLICATION_LIMIT) {
        processedIdsRef.current.shift();
      }

      fetchUnreadCount();
      fetchNotifications(true);

      const title = payload.data?.title || payload.notification?.title || "Update";
      const body = payload.data?.body || payload.data?.message || payload.notification?.body || "";
      addNotification("info", `${title}: ${body}`);
    });

    return () => unsubscribe();
  }, [isAuthenticated, fetchNotifications, fetchUnreadCount, addNotification]);

  // 4. Logout Cleanup Hook
  useEffect(() => {
    const handleLogoutTokenDeregister = async () => {
      if (!isAuthenticated && fcmToken && token === null) {
        try {
          await api.delete("/notifications/device-token", {
            data: { deviceToken: fcmToken },
          });
          console.log("[FCM Manager] Device token deregistered successfully upon logout.");
          setFcmToken(null);
          hasRegisteredRef.current = false;
        } catch (err) {
          console.error("[FCM Manager] Failed to deregister token during logout:", err);
        }
      }
    };
    handleLogoutTokenDeregister();
  }, [isAuthenticated, fcmToken, token]);

  return (
    <AnimatePresence>
      {showPrompt && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-6 right-6 z-[9999] max-w-sm p-5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl border border-slate-200/50 dark:border-slate-800/50 shadow-soft flex gap-4 items-start select-none font-inter"
        >
          <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
            <BellRing size={20} className="animate-bounce" />
          </div>

          <div className="flex-1 space-y-1">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 font-manrope">
              Enable notifications?
            </h4>
            <p className="text-xs text-text-secondary leading-relaxed font-semibold">
              Get real-time trip status alerts, driver arrivals, and secure payment updates directly on your device.
            </p>
            <div className="flex gap-2 pt-3">
              <button
                onClick={handleAcceptPermission}
                className="px-4 py-2 bg-primary text-white text-[11px] font-black rounded-lg hover:bg-secondary transition-colors"
              >
                Enable
              </button>
              <button
                onClick={handleDismissPermission}
                className="px-4 py-2 border border-border text-text-secondary text-[11px] font-black rounded-lg hover:bg-slate-50 transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>

          <button
            onClick={handleDismissPermission}
            className="text-text-secondary hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-all shrink-0"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

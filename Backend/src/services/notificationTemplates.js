const templates = {
  // --- Ride Events ---
  "ride.requested": (data) => ({
    title: "New Ride Offer",
    message: `New trip request from ${data.pickupAddress || "nearby user"} for ₹${data.fare}.`,
    type: "RIDE",
    priority: "HIGH",
    sound: "assigned",
    icon: "Car",
    deepLink: `/driver?offerId=${data.rideId}`,
    buttons: [
      { label: "View Offer", actionUrl: `/driver?offerId=${data.rideId}`, primary: true },
    ],
    expiresAt: new Date(Date.now() + 30 * 1000), // Offer expires in 30 seconds
  }),

  "ride.assigned": (data) => ({
    title: "Driver En Route",
    message: `${data.driverName} has accepted your trip. Vehicle details: ${data.vehicleType} (${data.vehicleNumber}).`,
    type: "RIDE",
    priority: "HIGH",
    sound: "assigned",
    icon: "UserCheck",
    deepLink: `/dashboard?rideId=${data.rideId}`,
    buttons: [
      { label: "Track Ride", actionUrl: `/dashboard?rideId=${data.rideId}`, primary: true },
    ],
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
  }),

  "ride.arrived": (data) => ({
    title: "Driver Arrived",
    message: `${data.driverName} is waiting for you at the pickup location. OTP for this ride is ${data.otp}.`,
    type: "RIDE",
    priority: "HIGH",
    sound: "assigned",
    icon: "MapPin",
    deepLink: `/dashboard?rideId=${data.rideId}`,
    buttons: [
      { label: "Show OTP", actionUrl: `/dashboard?rideId=${data.rideId}`, primary: true },
    ],
    expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000),
  }),

  "ride.started": (data) => ({
    title: "Trip Started",
    message: "Your trip is underway. Drive safely with Loopra!",
    type: "RIDE",
    priority: "MEDIUM",
    sound: "default",
    icon: "Navigation",
    deepLink: `/dashboard?rideId=${data.rideId}`,
    expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000),
  }),

  "ride.completed": (data) => ({
    title: "Trip Completed",
    message: `You have successfully reached your destination. Final fare: ₹${data.fare}.`,
    type: "RIDE",
    priority: "MEDIUM",
    sound: "default",
    icon: "CheckCircle",
    deepLink: `/dashboard?rideId=${data.rideId}`,
    buttons: [
      { label: "Rate Driver", actionUrl: `/dashboard?rideId=${data.rideId}&action=rate`, primary: true },
    ],
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // Expiry 90 days for archiving
  }),

  "ride.cancelled": (data) => ({
    title: "Trip Cancelled",
    message: `Your ride request (${data.rideId}) has been cancelled. Reason: ${data.reason || "User Request"}.`,
    type: "RIDE",
    priority: "HIGH",
    sound: "default",
    icon: "XCircle",
    deepLink: "/dashboard",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }),

  // --- Payment Events ---
  "payment.success": (data) => ({
    title: "Payment Received",
    message: `₹${data.amount} paid successfully for ride reference ${data.rideId}.`,
    type: "PAYMENT",
    priority: "MEDIUM",
    sound: "payment",
    icon: "CreditCard",
    deepLink: `/dashboard/settings/payments`,
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  }),

  "payment.failed": (data) => ({
    title: "Payment Failed",
    message: `Payment of ₹${data.amount} for ride ${data.rideId} failed. Please verify your payment methods.`,
    type: "PAYMENT",
    priority: "HIGH",
    sound: "payment",
    icon: "AlertTriangle",
    deepLink: `/dashboard/settings/payments`,
    buttons: [
      { label: "Retry Payment", actionUrl: `/dashboard/settings/payments`, primary: true },
    ],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }),

  // --- Driver Lifecycle ---
  "driver.submitted": (data) => ({
    title: "New Driver Application",
    message: `Applicant ${data.name} has submitted details for vehicle ${data.vehicleNumber}.`,
    type: "ADMIN",
    priority: "MEDIUM",
    sound: "default",
    icon: "FileText",
    deepLink: `/admin/driver-applications/${data.applicationId}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }),

  "driver.approved": () => ({
    title: "Application Approved!",
    message: "Welcome to the Loopra Fleet! Your driver portal is now active.",
    type: "DRIVER",
    priority: "HIGH",
    sound: "assigned",
    icon: "ShieldCheck",
    deepLink: "/driver",
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  }),

  "driver.rejected": (data) => ({
    title: "Application Rejected",
    message: `Your driver application was rejected: ${data.reason || "Invalid documents"}.`,
    type: "DRIVER",
    priority: "HIGH",
    sound: "default",
    icon: "ShieldAlert",
    deepLink: "/driver/onboarding",
    buttons: [
      { label: "Re-apply Now", actionUrl: "/driver/onboarding", primary: true },
    ],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }),

  // --- Support & Wallets ---
  "wallet.credited": (data) => ({
    title: "Wallet Balance Added",
    message: `₹${data.amount} has been successfully added to your Loopra wallet.`,
    type: "WALLET",
    priority: "MEDIUM",
    sound: "payment",
    icon: "Wallet",
    deepLink: "/dashboard",
    expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  }),

  // --- Emergency Alerts ---
  "emergency.alert": (data) => ({
    title: "SOS Alert Dispatched",
    message: `Emergency response active for Ride ${data.rideId}. Security forces have been notified.`,
    type: "EMERGENCY",
    priority: "HIGH",
    sound: "emergency",
    icon: "AlertOctagon",
    deepLink: `/dashboard?rideId=${data.rideId}`,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }),

  // --- Promotion & Referral ---
  "promotion.new": (data) => ({
    title: data.title || "Special Offer!",
    message: data.message || "Get exclusive discounts on your next ride.",
    type: "PROMOTION",
    priority: "LOW",
    sound: "silent",
    icon: "Tag",
    deepLink: "/dashboard",
    expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // Promo expires in 14 days
  }),

  "referral.success": (data) => ({
    title: "Referral Award Applied!",
    message: `Your friend ${data.friendName} signed up. You earned ₹50 coupon code!`,
    type: "REFERRAL",
    priority: "LOW",
    sound: "silent",
    icon: "Gift",
    deepLink: "/dashboard",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }),

  // --- Security & System ---
  "security.alert": (data) => ({
    title: "New Device Login",
    message: `A login was detected from device ${data.deviceInfo || "unknown"} at ${data.ip || "IP"}.`,
    type: "SECURITY",
    priority: "HIGH",
    sound: "default",
    icon: "ShieldAlert",
    deepLink: "/dashboard/settings/security",
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  }),

  "system.alert": (data) => ({
    title: data.title || "System Notification",
    message: data.message,
    type: "SYSTEM",
    priority: "MEDIUM",
    sound: "default",
    icon: "Info",
    deepLink: "/dashboard",
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }),
};

module.exports = {
  compile: (templateKey, data) => {
    if (!templates[templateKey]) {
      throw new Error(`Template key '${templateKey}' is not registered`);
    }
    return templates[templateKey](data);
  },
};

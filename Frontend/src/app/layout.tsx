import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { MapProvider } from "@/components/MapProvider";
import { NotificationContainer } from "@/components/NotificationContainer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Drivo | Premium Ride Booking",
  description: "Book your ride A and B with Drivo. The most reliable return ride system.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <MapProvider>
            {children}
            <NotificationContainer />
          </MapProvider>
        </AuthProvider>
        <script src="https://checkout.razorpay.com/v1/checkout.js" async></script>
      </body>
    </html>
  );
}

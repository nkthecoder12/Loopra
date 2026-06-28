import React from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ScrollProgressBar, LegalBackNav, StickyTOC } from "@/components/LegalLayoutHelper";

export const metadata: Metadata = {
  title: "Privacy Policy | Loopra Mobility",
  description: "Learn how Loopra collects, stores, processes, shares, and protects your personal information, user rights, and privacy practices.",
};

const tocItems = [
  { id: "section-1", title: "1. Information We Collect" },
  { id: "section-2", title: "2. How We Use Your Information" },
  { id: "section-3", title: "3. How We Share Your Information" },
  { id: "section-4", title: "4. Data Retention" },
  { id: "section-5", title: "5. Data Security" },
  { id: "section-6", title: "6. Location Data" },
  { id: "section-7", title: "7. Children’s Privacy" },
  { id: "section-8", title: "8. Your Rights and Choices" },
  { id: "section-9", title: "9. Cookies & Tracking" },
  { id: "section-10", title: "10. Third-Party Links" },
  { id: "section-11", title: "11. Grievance Officer" },
  { id: "section-12", title: "12. Policy Changes" },
  { id: "section-13", title: "13. Contact Us" },
];

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-inter">
      <ScrollProgressBar />
      
      <LegalBackNav 
        title="Privacy Policy" 
        subtitle="Last updated: June 25, 2026 • Governing all Loopra platforms & mobility services" 
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Document Content */}
          <article className="lg:col-span-3 bg-surface p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-border shadow-soft space-y-8 text-sm sm:text-base leading-relaxed text-text-secondary">
            
            <div className="bg-slate-50 border-l-4 border-accent p-4 rounded-r-xl text-xs sm:text-sm text-text-primary font-medium">
              Loopra Mobility (&ldquo;Loopra&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) operates a scheduled shuttle and ride-booking platform in Coimbatore, Tamil Nadu, India, accessible through our website (loopra.co.in) and mobile application. This Privacy Policy explains how we collect, use, store, share, and protect your personal information when you use Loopra&rsquo;s services as a rider, driver, or corporate partner.
              <br /><br />
              By creating an account, booking a ride, or otherwise using Loopra&rsquo;s services, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with this policy, please do not use our services.
            </div>

            <section id="section-1" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">1. Information We Collect</h2>
              
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-text-primary font-manrope">1.1 Information You Provide Directly</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Name, phone number, and email address during account registration</li>
                  <li>Profile photo (optional)</li>
                  <li>Pickup and drop-off locations for each ride booking</li>
                  <li>Payment information (processed via third-party payment gateways &mdash; we do not store card or UPI credentials)</li>
                  <li>Government-issued ID and vehicle documents (for drivers and vehicle owners only)</li>
                  <li>Communications with our support team, including chat messages and call recordings for quality and safety purposes</li>
                  <li>Feedback, ratings, and reviews submitted after a ride</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary font-manrope">1.2 Information Collected Automatically</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Device information &mdash; device type, operating system, unique device identifiers</li>
                  <li>Location data &mdash; real-time GPS location during an active ride, for trip tracking, driver matching, and safety</li>
                  <li>Usage data &mdash; app interactions, booking history, ride frequency, and corridor preferences</li>
                  <li>Log data &mdash; IP address, browser type, access times, and pages viewed on our website</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary font-manrope">1.3 Information from Third Parties</h3>
                <ul className="list-disc pl-5 space-y-1.5">
                  <li>Payment confirmation details from payment gateway providers (Razorpay, UPI providers, etc.)</li>
                  <li>Map and route data from mapping service providers (Google Maps Platform)</li>
                  <li>Corporate booking details when you are added to a Loopra account by your employer for shuttle services</li>
                </ul>
              </div>
            </section>

            <section id="section-2" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">2. How We Use Your Information</h2>
              <p>We use the information we collect for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>To create and manage your Loopra account</li>
                <li>To match riders with available drivers and process ride bookings, including pre-scheduled return trips</li>
                <li>To calculate fares, process payments, and issue receipts</li>
                <li>To send booking confirmations, ride status updates, and return-trip reminders via SMS, push notification, or WhatsApp</li>
                <li>To verify driver identity, vehicle documents, and maintain fleet safety standards</li>
                <li>To provide customer support and resolve disputes, complaints, or cancellations</li>
                <li>To improve our services through analysis of ride patterns, corridor demand, and app performance</li>
                <li>To detect, prevent, and address fraud, abuse, or violations of our Terms &amp; Conditions</li>
                <li>To comply with legal obligations under Indian law, including the Information Technology Act, 2000 and applicable motor vehicle regulations</li>
                <li>To send promotional offers and updates about Loopra, where you have not opted out</li>
              </ul>
            </section>

            <section id="section-3" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">3. How We Share Your Information</h2>
              <p>Loopra does not sell your personal information to third parties. We share information only in the following circumstances:</p>

              <div className="space-y-2">
                <h3 className="text-base font-bold text-text-primary font-manrope">3.1 With Drivers and Riders</h3>
                <p>To facilitate a ride, we share limited information between the rider and the assigned driver &mdash; including name, pickup/drop location, and contact number for coordination purposes only.</p>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-base font-bold text-text-primary font-manrope">3.2 With Corporate Partners</h3>
                <p>If you are using Loopra through an employer-sponsored shuttle program, we may share your ride activity (such as attendance and usage frequency) with your employer&rsquo;s designated HR or admin contact, strictly for billing and shuttle management purposes.</p>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-base font-bold text-text-primary font-manrope">3.3 With Service Providers</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Payment gateway providers, to process transactions securely</li>
                  <li>Mapping and route optimization providers, to calculate distances and ETAs</li>
                  <li>Cloud hosting and data storage providers, to securely store app data</li>
                  <li>SMS and notification service providers, to deliver booking alerts</li>
                </ul>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-base font-bold text-text-primary font-manrope">3.4 For Legal Reasons</h3>
                <p>We may disclose your information if required to do so by law, court order, or governmental authority, or if we believe in good faith that disclosure is necessary to protect the rights, property, or safety of Loopra, our users, drivers, or the public.</p>
              </div>
            </section>

            <section id="section-4" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">4. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account remains active, and for a reasonable period thereafter to comply with legal, accounting, and regulatory requirements. Ride history and payment records are retained for a minimum of 5 years in accordance with Indian tax and financial record-keeping regulations. You may request deletion of your account and associated data at any time, subject to our legal retention obligations as described in Section 8.
              </p>
            </section>

            <section id="section-5" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">5. Data Security</h2>
              <p>
                We implement reasonable technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include encrypted data transmission (HTTPS/TLS), restricted access to personal data on a need-to-know basis, and regular security reviews of our systems.
              </p>
              <p>
                However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your personal information, we cannot guarantee its absolute security.
              </p>
            </section>

            <section id="section-6" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">6. Location Data</h2>
              <p>
                Loopra collects precise location data during active rides to enable accurate pickup, route tracking, and driver navigation. For riders, location access can be managed through your device settings; however, disabling location services may limit or prevent you from booking rides through the app. For drivers, continuous location sharing is required while on duty, for safety, route verification, and fare calculation purposes.
              </p>
            </section>

            <section id="section-7" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">7. Children’s Privacy</h2>
              <p>
                Loopra&rsquo;s services are intended for users who are 18 years of age or older. We do not knowingly collect personal information from individuals under 18. If we become aware that we have inadvertently collected personal information from a minor, we will take steps to delete such information promptly.
              </p>
            </section>

            <section id="section-8" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">8. Your Rights and Choices</h2>
              <p>As a user, you have the following rights regarding your personal information, subject to applicable Indian data protection law (including the Digital Personal Data Protection Act, 2023):</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong className="text-text-primary">Right to Access</strong> &mdash; You may request a copy of the personal information we hold about you</li>
                <li><strong className="text-text-primary">Right to Correction</strong> &mdash; You may request correction of inaccurate or incomplete information</li>
                <li><strong className="text-text-primary">Right to Erasure</strong> &mdash; You may request deletion of your account and personal data, subject to legal retention requirements</li>
                <li><strong className="text-text-primary">Right to Withdraw Consent</strong> &mdash; You may withdraw consent for promotional communications at any time</li>
                <li><strong className="text-text-primary">Right to Grievance Redressal</strong> &mdash; You may raise concerns about how your data is handled through our Grievance Officer (see Section 11)</li>
              </ul>
              <p>To exercise any of these rights, please contact us at privacy@loopra.co.in. We will respond to your request within a reasonable timeframe, generally within 30 days.</p>
            </section>

            <section id="section-9" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">9. Cookies and Tracking Technologies</h2>
              <p>
                Our website uses cookies and similar tracking technologies to enhance user experience, remember preferences, and analyze website traffic. You may control cookie preferences through your browser settings. Disabling cookies may affect certain website functionality.
              </p>
            </section>

            <section id="section-10" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">10. Third-Party Links and Services</h2>
              <p>
                Our app and website may contain links to third-party websites or services (such as payment gateways or map providers) that are not operated by us. We are not responsible for the privacy practices of these third parties. We encourage you to review their respective privacy policies.
              </p>
            </section>

            <section id="section-11" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">11. Grievance Officer</h2>
              <p>In accordance with the Information Technology Act, 2000 and rules made thereunder, the contact details of our Grievance Officer are provided below:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Name:</strong> [To be appointed]</li>
                <li><strong>Email:</strong> grievance@loopra.co.in</li>
                <li><strong>Address:</strong> Coimbatore, Tamil Nadu, India</li>
              </ul>
              <p className="text-xs text-text-secondary bg-slate-50 p-3 rounded-lg">
                The Grievance Officer shall acknowledge complaints within 24 hours and resolve them within 15 days from the date of receipt, as required under applicable Indian law.
              </p>
            </section>

            <section id="section-12" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">12. Changes to This Privacy Policy</h2>
              <p>
                We may update this Privacy Policy from time to time to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes through the app, website, or via email. Your continued use of Loopra&rsquo;s services after such changes constitutes acceptance of the updated policy.
              </p>
            </section>

            <section id="section-13" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">13. Contact Us</h2>
              <p>If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Email:</strong> hello@loopra.co.in</li>
                <li><strong>Website:</strong> loopra.co.in</li>
                <li><strong>Address:</strong> Coimbatore, Tamil Nadu, India</li>
              </ul>
              <div className="pt-4 text-center font-bold text-primary font-manrope">
                Loopra Mobility &mdash; Every ride comes full circle.
              </div>
            </section>

          </article>

          {/* Sidebar Sticky TOC */}
          <aside className="lg:col-span-1">
            <StickyTOC items={tocItems} />
          </aside>

        </div>
      </main>

      <Footer />
    </div>
  );
}

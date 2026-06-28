import React from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ScrollProgressBar, LegalBackNav, StickyTOC } from "@/components/LegalLayoutHelper";

export const metadata: Metadata = {
  title: "Cancellation & Refund Policy | Loopra Mobility",
  description: "Official cancellation rules, rider and driver cancellation fees, refund eligibility, timelines, and no-show policies for Loopra.",
};

const tocItems = [
  { id: "section-1", title: "1. Standard Trip Cancellations" },
  { id: "section-2", title: "2. Pre-Booked Return Trip Cancellations" },
  { id: "section-3", title: "3. Driver-Initiated Cancellations" },
  { id: "section-4", title: "4. No-Show Policy" },
  { id: "section-5", title: "5. Refund Process" },
  { id: "section-6", title: "6. Corporate Bookings & Passes" },
  { id: "section-7", title: "7. Force Majeure" },
  { id: "section-8", title: "8. Changes to This Policy" },
  { id: "section-9", title: "9. Contact Us" },
];

export default function CancellationRefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-inter">
      <ScrollProgressBar />
      
      <LegalBackNav 
        title="Cancellation & Refund Policy" 
        subtitle="Last updated: June 25, 2026 • Effective across all Loopra operating corridors" 
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Document Content */}
          <article className="lg:col-span-3 bg-surface p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-border shadow-soft space-y-8 text-sm sm:text-base leading-relaxed text-text-secondary">
            
            <div className="bg-slate-50 border-l-4 border-accent p-4 rounded-r-xl text-xs sm:text-sm text-text-primary font-medium">
              This Cancellation &amp; Refund Policy (&ldquo;Policy&rdquo;) explains the terms under which riders and drivers may cancel a booking on the Loopra platform, the fees applicable to such cancellations, and the process for requesting refunds. This Policy forms part of, and should be read together with, our Terms &amp; Conditions.
              <br /><br />
              Loopra&rsquo;s entire service promise is built on reliability &mdash; a guaranteed ride, and a guaranteed return. This Policy exists to protect that promise for every rider and every driver on our platform.
            </div>

            <section id="section-1" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">1. Standard Trip Cancellations (Rider-Initiated)</h2>
              <p>The following cancellation fees apply when a rider cancels a standard (outbound) trip booking:</p>
              
              <div className="overflow-x-auto my-4 rounded-xl border border-border">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-primary text-white font-manrope">
                      <th className="p-3.5 sm:p-4 font-bold">Cancellation Scenario</th>
                      <th className="p-3.5 sm:p-4 font-bold">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Cancelled before a driver is assigned</td>
                      <td className="p-3.5 sm:p-4 font-bold text-success">Free &mdash; no charge</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Cancelled within 2 minutes of driver assignment</td>
                      <td className="p-3.5 sm:p-4 font-bold text-success">Free &mdash; no charge</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Cancelled after 2 minutes of driver assignment</td>
                      <td className="p-3.5 sm:p-4 font-bold text-primary">₹30 flat fee</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Cancelled after the driver has arrived at pickup location</td>
                      <td className="p-3.5 sm:p-4 font-bold text-primary">₹50 flat fee</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section id="section-2" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">2. Pre-Booked Return Trip Cancellations</h2>
              <p>
                Pre-booked return trips (the &ldquo;Loop&rdquo; feature) carry separate cancellation terms, because drivers plan their schedule around your confirmed return booking. Approximately one hour before your scheduled return time, Loopra will send a reminder allowing you to confirm, reschedule, or cancel.
              </p>
              
              <div className="overflow-x-auto my-4 rounded-xl border border-border">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-primary text-white font-manrope">
                      <th className="p-3.5 sm:p-4 font-bold">Cancellation Scenario</th>
                      <th className="p-3.5 sm:p-4 font-bold">Fee</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-surface">
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Cancelled more than 2 hours before scheduled return</td>
                      <td className="p-3.5 sm:p-4 font-bold text-success">Free &mdash; no charge</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Cancelled 1–2 hours before scheduled return</td>
                      <td className="p-3.5 sm:p-4 font-bold text-primary">₹30 flat fee</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Cancelled less than 1 hour before scheduled return</td>
                      <td className="p-3.5 sm:p-4 font-bold text-primary">₹60 flat fee</td>
                    </tr>
                    <tr className="hover:bg-slate-50 transition-colors">
                      <td className="p-3.5 sm:p-4 font-medium text-text-primary">Rescheduled (not cancelled) more than 2 hours before</td>
                      <td className="p-3.5 sm:p-4 font-bold text-success">Free &mdash; no charge</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="italic text-xs sm:text-sm text-text-secondary bg-slate-50 p-3 rounded-lg">
                Rescheduling your return time is always free if done more than 2 hours in advance, and is the recommended option if your plans change &mdash; simply update your return time in the app rather than cancelling outright.
              </p>
            </section>

            <section id="section-3" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">3. Driver-Initiated Cancellations</h2>
              <p>
                Because Loopra operates a fully controlled, vetted fleet, driver-initiated cancellations are treated as a serious deviation from our service standard. The following penalties apply to drivers who cancel a confirmed booking without a valid, verifiable reason (such as a documented vehicle breakdown or medical emergency):
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong className="text-text-primary">First instance in a calendar month:</strong> ₹100 penalty deducted from driver earnings, and the rider is issued a ₹50 ride credit</li>
                <li><strong className="text-text-primary">Second instance in a calendar month:</strong> ₹200 penalty and a formal warning</li>
                <li><strong className="text-text-primary">Third instance in a calendar month:</strong> Account suspension pending review by the Loopra operations team</li>
              </ul>
              <p>
                If a driver cancels a confirmed booking, Loopra will make reasonable efforts to assign an alternate driver immediately. If no alternate driver is available within a reasonable time, the rider is entitled to a full refund of the original fare in addition to the ₹50 ride credit described above.
              </p>
            </section>

            <section id="section-4" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">4. No-Show Policy</h2>
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-bold text-text-primary font-manrope">4.1 Rider No-Show</h3>
                <p>
                  If a rider is not present at the designated pickup point within 5 minutes of the driver&rsquo;s arrival, and does not respond to the driver&rsquo;s call or in-app message, the trip may be marked as a &ldquo;rider no-show.&rdquo; In this case, the full fare is charged and no refund will be issued, as the driver and vehicle were made available as scheduled.
                </p>
              </div>
              <div className="space-y-3 pt-2">
                <h3 className="text-base sm:text-lg font-bold text-text-primary font-manrope">4.2 Driver No-Show</h3>
                <p>
                  If a driver does not arrive within 10 minutes of the scheduled pickup time without prior communication, the rider may cancel the trip free of charge and is entitled to a full refund if any advance payment was made. The rider will also receive a ₹50 ride credit as a service recovery gesture.
                </p>
              </div>
            </section>

            <section id="section-5" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">5. Refund Process</h2>
              <ul className="list-disc pl-5 space-y-2">
                <li>Eligible refunds will be processed to the original payment method used for the booking (UPI, card, or net banking) within 5&ndash;7 business days.</li>
                <li>Refunds for ride credits issued by Loopra (such as service recovery credits) will be reflected in your Loopra wallet immediately and can be used toward future bookings.</li>
                <li>In case of a payment gateway error where the fare was charged but the ride was not completed, riders should report the issue through in-app support within 48 hours for prompt resolution.</li>
                <li>Refunds are not provided for completed trips except where Loopra determines, at its sole discretion, that a service failure (such as significant route deviation, safety incident, or major delay caused solely by the driver) occurred.</li>
              </ul>
            </section>

            <section id="section-6" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">6. Corporate Bookings and Monthly Passes</h2>
              <p>
                Cancellation and refund terms for corporate shuttle contracts and prepaid monthly rider passes are governed by the specific terms agreed upon at the time of contract or pass purchase. As a general policy:
              </p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Monthly passes are non-refundable once activated, except in cases of documented relocation or extended medical leave, subject to Loopra&rsquo;s review and approval</li>
                <li>Corporate contracts may be cancelled with 30 days&rsquo; written notice as specified in the respective service agreement</li>
                <li>Unused rides on a monthly pass do not carry forward to the next billing cycle unless otherwise specified in the applicable plan</li>
              </ul>
            </section>

            <section id="section-7" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">7. Force Majeure</h2>
              <p>
                Loopra shall not be liable for cancellations, delays, or service disruptions caused by events beyond our reasonable control, including but not limited to natural disasters, extreme weather, civil unrest, government-imposed restrictions, road closures, or strikes. In such cases, affected riders will be offered a full refund or ride credit at Loopra&rsquo;s discretion, but no further compensation will be provided.
              </p>
            </section>

            <section id="section-8" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">8. Changes to This Policy</h2>
              <p>
                Loopra reserves the right to revise this Cancellation &amp; Refund Policy at any time to reflect changes in our operations, fare structure, or applicable law. Material changes will be communicated through the app or website. Continued use of our Services after such changes constitutes acceptance of the revised Policy.
              </p>
            </section>

            <section id="section-9" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">9. Contact Us</h2>
              <p>For questions about a specific cancellation, refund status, or this Policy in general, please contact us at:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Email:</strong> support@loopra.co.in</li>
                <li><strong>In-app support:</strong> Available 7 days a week through the Help section</li>
                <li><strong>Website:</strong> loopra.co.in</li>
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

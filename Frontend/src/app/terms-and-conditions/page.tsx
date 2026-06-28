import React from "react";
import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { ScrollProgressBar, LegalBackNav, StickyTOC } from "@/components/LegalLayoutHelper";

export const metadata: Metadata = {
  title: "Terms & Conditions | Loopra Mobility",
  description: "Official legal agreement governing user eligibility, ride bookings, driver obligations, return loops, liabilities, and platform usage for Loopra.",
};

const tocItems = [
  { id: "section-1", title: "1. Eligibility" },
  { id: "section-2", title: "2. Nature of Services" },
  { id: "section-3", title: "3. Booking & Return Feature" },
  { id: "section-4", title: "4. Fares and Payment" },
  { id: "section-5", title: "5. Driver Obligations" },
  { id: "section-6", title: "6. Cancellations" },
  { id: "section-7", title: "7. Rider Conduct" },
  { id: "section-8", title: "8. Safety" },
  { id: "section-9", title: "9. Limitation of Liability" },
  { id: "section-10", title: "10. Indemnification" },
  { id: "section-11", title: "11. Intellectual Property" },
  { id: "section-12", title: "12. Account Termination" },
  { id: "section-13", title: "13. Changes to Services" },
  { id: "section-14", title: "14. Governing Law" },
  { id: "section-15", title: "15. Contact Us" },
];

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-inter">
      <ScrollProgressBar />
      
      <LegalBackNav 
        title="Terms & Conditions" 
        subtitle="Last updated: June 25, 2026 • Legal framework for Loopra platform usage" 
      />

      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Main Document Content */}
          <article className="lg:col-span-3 bg-surface p-6 sm:p-10 rounded-2xl sm:rounded-3xl border border-border shadow-soft space-y-8 text-sm sm:text-base leading-relaxed text-text-secondary">
            
            <div className="bg-slate-50 border-l-4 border-accent p-4 rounded-r-xl text-xs sm:text-sm text-text-primary font-medium">
              These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of the Loopra mobile application, website (loopra.co.in), and related services (collectively, the &ldquo;Services&rdquo;) provided by Loopra Mobility (&ldquo;Loopra&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;), a fleet-operated ride and shuttle platform based in Coimbatore, Tamil Nadu, India.
              <br /><br />
              By creating an account, booking a ride, registering as a driver, or otherwise accessing our Services, you agree to be bound by these Terms. If you do not agree to these Terms, you must not access or use the Services.
            </div>

            <section id="section-1" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">1. Eligibility</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>You must be at least 18 years of age to create a Loopra account or book a ride.</li>
                <li>You must provide accurate, current, and complete information during registration.</li>
                <li>Drivers must hold a valid driving license, vehicle registration, insurance, and any other documentation required under the Motor Vehicles Act, 1988 and applicable Tamil Nadu transport regulations.</li>
                <li>Loopra reserves the right to refuse service, suspend, or terminate any account that provides false, misleading, or incomplete information.</li>
              </ul>
            </section>

            <section id="section-2" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">2. Nature of Services</h2>
              <p>
                Loopra operates a fleet-controlled, scheduled ride and shuttle service. Unlike marketplace-based ride aggregators, Loopra directly onboards, vets, and manages its driver-partner fleet. Our core service includes:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Scheduled point-to-point ride bookings on fixed corridors within Coimbatore</li>
                <li>Pre-booking of return trips at the time of the original booking (the &ldquo;Loop&rdquo; feature)</li>
                <li>Fare calculation based on distance, time, and applicable surcharges as set out in our fare policy</li>
                <li>Corporate shuttle arrangements for partner organizations, subject to separate corporate agreements</li>
              </ul>
              <p>
                Loopra does not guarantee ride availability outside of officially supported corridors and operating hours, which may be updated from time to time and published on our app or website.
              </p>
            </section>

            <section id="section-3" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">3. Booking and the Loop (Return Trip) Feature</h2>
              
              <div className="space-y-2">
                <h3 className="text-base font-bold text-text-primary font-manrope">3.1 Standard Bookings</h3>
                <p>Riders may book a one-way trip on any supported corridor, subject to driver and vehicle availability. The fare for a standard trip is calculated and displayed before confirmation.</p>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-base font-bold text-text-primary font-manrope">3.2 Pre-Booked Return Trips</h3>
                <p>
                  Riders may pre-book a return trip at the time of their original booking by specifying an estimated return time. A discount of 5% (or such other percentage as may be communicated in the app) applies to the pre-booked return fare. Loopra will send a confirmation reminder approximately one hour before the scheduled return time, during which the rider may confirm, reschedule, or cancel the return trip subject to the cancellation terms in Section 6.
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="text-base font-bold text-text-primary font-manrope">3.3 No Guarantee of Exact Timing</h3>
                <p>
                  While Loopra strives to honor scheduled pickup and return times, actual arrival times may vary due to traffic conditions, weather, or other circumstances beyond our reasonable control. Loopra is not liable for minor delays but will make reasonable efforts to notify riders of any expected delay.
                </p>
              </div>
            </section>

            <section id="section-4" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">4. Fares and Payment</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All fares are calculated based on Loopra&rsquo;s published fare structure, including base fare, per-kilometre charges, applicable surcharges (such as night-time surcharges), and any return-trip discount.</li>
                <li>Loopra does not apply demand-based surge pricing. Fares remain consistent regardless of time of day or demand fluctuations, except for the published night-time surcharge.</li>
                <li>Payment may be made via UPI, debit/credit card, net banking, or any other payment method made available within the app, processed through third-party payment gateway providers.</li>
                <li>Riders are responsible for ensuring sufficient funds or valid payment methods are available at the time of booking and at the completion of the ride.</li>
                <li>In the event of a payment failure after a ride is completed, Loopra reserves the right to suspend the rider&rsquo;s account until outstanding dues are settled.</li>
              </ul>
            </section>

            <section id="section-5" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">5. Driver Obligations</h2>
              <p>Drivers operating on the Loopra platform agree to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Maintain a valid driving license, vehicle registration, insurance, and pollution certificate at all times</li>
                <li>Operate only the vehicle(s) registered and approved by Loopra</li>
                <li>Honor confirmed bookings, including pre-booked return trips, except in cases of genuine emergency</li>
                <li>Maintain the vehicle in a clean, safe, and roadworthy condition</li>
                <li>Treat riders with courtesy and professionalism at all times</li>
                <li>Not solicit or accept rides outside the Loopra platform while on duty for Loopra-assigned trips</li>
              </ul>
              <p className="text-xs text-text-secondary bg-slate-50 p-3 rounded-lg">
                Repeated unjustified cancellations, rider complaints, or violations of these obligations may result in penalties, suspension, or permanent removal from the Loopra platform, as detailed in our driver partnership agreement.
              </p>
            </section>

            <section id="section-6" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">6. Cancellations</h2>
              <p>
                Cancellation terms, including applicable fees for rider and driver cancellations, are governed by Loopra&rsquo;s Cancellation &amp; Refund Policy, available separately on our website and app. By using our Services, you agree to be bound by that policy as well.
              </p>
            </section>

            <section id="section-7" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">7. Rider Conduct</h2>
              <p>Riders agree not to:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Use the Services for any unlawful purpose or in violation of any applicable law</li>
                <li>Harass, threaten, or behave inappropriately toward drivers or other riders</li>
                <li>Damage or vandalize any vehicle used in connection with the Services</li>
                <li>Carry illegal substances, weapons, or hazardous materials during a ride</li>
                <li>Provide false information regarding pickup/drop locations or booking details with intent to defraud</li>
                <li>Share account credentials with third parties or use another person&rsquo;s account without authorization</li>
              </ul>
              <p>
                Loopra reserves the right to suspend or terminate the account of any rider found to be in violation of this Section, and may report unlawful conduct to the appropriate authorities.
              </p>
            </section>

            <section id="section-8" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">8. Safety</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>All Loopra vehicles are subject to periodic safety and document verification checks.</li>
                <li>Riders are encouraged to verify the driver&rsquo;s name, vehicle number, and photo displayed in the app before boarding.</li>
                <li>In case of any safety concern during a ride, riders may use the in-app support or emergency contact feature, where available.</li>
                <li>Loopra cooperates with law enforcement authorities in the event of any safety incident, in accordance with applicable law.</li>
              </ul>
            </section>

            <section id="section-9" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Loopra shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill, arising out of or in connection with your use of the Services.
              </p>
              <p>
                Loopra&rsquo;s total liability for any claim arising from a single ride shall not exceed the total fare paid by the rider for that specific ride. Loopra does not own or operate as an insurer of riders, drivers, or third parties, and nothing in these Terms shall be construed as an undertaking to provide insurance coverage beyond what is mandated under applicable Indian motor vehicle insurance regulations.
              </p>
            </section>

            <section id="section-10" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">10. Indemnification</h2>
              <p>
                You agree to indemnify and hold harmless Loopra, its founders, employees, and affiliated drivers from any claims, damages, losses, liabilities, and expenses (including reasonable legal fees) arising out of your breach of these Terms, your violation of any law, or your misuse of the Services.
              </p>
            </section>

            <section id="section-11" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">11. Intellectual Property</h2>
              <p>
                The Loopra name, logo, tagline (&ldquo;Every ride comes full circle&rdquo;), app design, and underlying technology &mdash; including our return-trip booking and matching system &mdash; are the proprietary property of Loopra Mobility. Nothing in these Terms grants you any right, title, or interest in Loopra&rsquo;s intellectual property, except the limited right to use the app for its intended purpose.
              </p>
            </section>

            <section id="section-12" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">12. Account Suspension and Termination</h2>
              <p>
                Loopra reserves the right to suspend or terminate your account at any time, with or without notice, if we reasonably believe you have violated these Terms, engaged in fraudulent activity, or posed a safety risk to our drivers, riders, or platform. You may also terminate your account at any time by contacting hello@loopra.co.in.
              </p>
            </section>

            <section id="section-13" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">13. Changes to Services and Terms</h2>
              <p>
                Loopra reserves the right to modify, suspend, or discontinue any part of the Services at any time. We may also revise these Terms from time to time. Material changes will be communicated through the app, website, or via email. Continued use of the Services after such changes constitutes your acceptance of the revised Terms.
              </p>
            </section>

            <section id="section-14" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">14. Governing Law and Jurisdiction</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or in connection with these Terms or the Services shall be subject to the exclusive jurisdiction of the courts located in Coimbatore, Tamil Nadu, India.
              </p>
            </section>

            <section id="section-15" className="space-y-4 pt-4 border-t border-border">
              <h2 className="text-xl sm:text-2xl font-bold text-primary font-manrope">15. Contact Us</h2>
              <p>For any questions regarding these Terms &amp; Conditions, please contact us at:</p>
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

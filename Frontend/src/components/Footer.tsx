"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, FileText, RefreshCw, Mail, HelpCircle, Info, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-primary text-white pt-12 pb-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10 pb-10 border-b border-white/10">
          
          {/* Brand Column */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center font-black text-xl text-white shadow-md font-manrope">
                L
              </div>
              <span className="text-2xl font-black tracking-tight text-white font-manrope">Loopra</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-sm font-inter">
              Coimbatore&apos;s premier fleet mobility platform. Instant rides and guaranteed return loops engineered for safety, speed, and comfort. Every ride comes full circle.
            </p>
            {/* Social Icons (Inline SVG for maximum compatibility & zero compilation errors) */}
            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200"
                aria-label="LinkedIn"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.25V10.9H6.46M7.86 6.72a1.4 1.4 0 1 0 1.4 1.4 1.4 1.4 0 0 0-1.4-1.4Z"/>
                </svg>
              </a>
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200"
                aria-label="Instagram"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a 
                href="https://x.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-accent flex items-center justify-center text-slate-300 hover:text-white transition-all duration-200"
                aria-label="X (Twitter)"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Legal Document Links */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-manrope">Legal &amp; Compliance</h3>
            <ul className="space-y-2.5 text-xs text-slate-300 font-inter">
              <li>
                <Link href="/privacy-policy" className="hover:text-soft-accent flex items-center gap-2 transition-colors">
                  <ShieldCheck size={14} className="text-accent" /> Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms-and-conditions" className="hover:text-soft-accent flex items-center gap-2 transition-colors">
                  <FileText size={14} className="text-accent" /> Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link href="/cancellation-refund-policy" className="hover:text-soft-accent flex items-center gap-2 transition-colors">
                  <RefreshCw size={14} className="text-accent" /> Cancellation &amp; Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Platform & Company */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-manrope">Platform</h3>
            <ul className="space-y-2.5 text-xs text-slate-300 font-inter">
              <li>
                <a href="#about" className="hover:text-soft-accent flex items-center gap-2 transition-colors">
                  <Info size={14} className="text-accent" /> About Loopra
                </a>
              </li>
              <li>
                <a href="mailto:support@loopra.co.in" className="hover:text-soft-accent flex items-center gap-2 transition-colors">
                  <Mail size={14} className="text-accent" /> Contact Us
                </a>
              </li>
              <li>
                <a href="mailto:support@loopra.co.in" className="hover:text-soft-accent flex items-center gap-2 transition-colors">
                  <HelpCircle size={14} className="text-accent" /> Help &amp; Support
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Summary */}
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 font-manrope">Headquarters</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-3 font-inter">
              Loopra Mobility Technologies Pvt Ltd.<br />
              Coimbatore, Tamil Nadu, India
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-xs text-soft-accent font-medium font-inter">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span> Service Operational 24/7
            </div>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400 font-inter">
          <p>© {new Date().getFullYear()} Loopra Mobility. All rights reserved.</p>
          <div className="flex items-center gap-1 text-slate-300">
            <span>Made with</span>
            <Heart size={14} className="text-red-500 fill-red-500 inline" />
            <span>in Coimbatore</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

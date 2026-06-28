"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100;
        setScrollProgress(currentProgress);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-slate-200 z-50">
      <div 
        className="h-full bg-accent transition-all duration-150 ease-out"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

export function LegalBackNav({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="bg-surface border-b border-border py-8 px-4 sm:px-6 lg:px-8 mb-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold text-accent tracking-wider uppercase mb-1">
            Loopra Legal &amp; Compliance
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-primary tracking-tight font-manrope">{title}</h1>
          <p className="text-xs text-text-secondary mt-1 font-medium">{subtitle}</p>
        </div>
        <Link 
          href="/login" 
          className="inline-flex items-center gap-2 text-xs font-bold text-primary bg-background border border-border px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-all shadow-sm w-fit"
        >
          <ArrowLeft size={16} /> Back to Login
        </Link>
      </div>
    </header>
  );
}

export function StickyTOC({ items }: { items: { id: string; title: string }[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-80px 0px -60% 0px" }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="hidden lg:block sticky top-24 space-y-3 p-5 bg-surface rounded-2xl border border-border shadow-soft">
      <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider font-manrope border-b pb-2">
        Table of Contents
      </h3>
      <ul className="space-y-2 text-xs">
        {items.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={`block transition-colors duration-150 py-1 ${
                activeId === item.id 
                  ? "text-accent font-bold pl-2 border-l-2 border-accent" 
                  : "text-text-secondary hover:text-primary"
              }`}
            >
              {item.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Shield, 
  Lock, 
  Palette, 
  Globe, 
  CreditCard, 
  HelpCircle, 
  FileText, 
  Info, 
  LogOut, 
  ChevronRight, 
  User, 
  Sliders
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { BecomeDriverCTA } from '@/components/BecomeDriverCTA';

export default function SettingsPage() {
  const router = useRouter();
  const { clearCredentials, user } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      clearCredentials();
      addNotification('info', 'Logged out successfully');
      router.push('/login');
    }
  };

  const sections = [
    {
      title: 'Account & Preferences',
      items: [
        { icon: User, title: 'Profile Information', desc: 'Manage your personal details and avatar', href: '/dashboard/profile' },
        { icon: Bell, title: 'Notifications', desc: 'Configure ride alerts, emails, and SMS updates', href: '#' },
        { icon: Sliders, title: 'Ride Preferences', desc: 'Set preferred vehicle type, quiet mode, and temperature', href: '#' },
        { icon: CreditCard, title: 'Payments & Wallet', desc: 'Manage credit cards, UPI, and Loopra balance', href: '#' },
      ]
    },
    {
      title: 'Privacy & Security',
      items: [
        { icon: Shield, title: 'Privacy Settings', desc: 'Control location sharing and trip history visibility', href: '#' },
        { icon: Lock, title: 'Security & Password', desc: 'Manage two-factor authentication and passwords', href: '#' },
      ]
    },
    {
      title: 'App System',
      items: [
        { icon: Palette, title: 'Appearance', desc: 'Light, Dark, and System contrast modes', href: '#' },
        { icon: Globe, title: 'Language & Region', desc: 'English (US), Coimbatore Region (IN)', href: '#' },
        { icon: HelpCircle, title: 'Help & Support', desc: '24/7 Rider helpline, FAQs, and dispute resolution', href: '#' },
        { icon: FileText, title: 'Legal & Terms', desc: 'Terms of service, privacy policy, and driver terms', href: '#' },
        { icon: Info, title: 'About Loopra', desc: 'Version 1.0.0 (Build 2026.06.27)', href: '#' },
      ]
    }
  ];

  return (
    <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-background space-y-8 font-inter">
      {/* Page Title Header */}
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight font-manrope">System Settings</h1>
          <p className="text-text-secondary font-medium text-sm mt-1">Manage your application preferences and security.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Become a Driver Promo Banner */}
        {user?.role !== 'DRIVER' && (
          <BecomeDriverCTA variant="banner" />
        )}

        {/* Settings Categories */}
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-secondary px-2 font-manrope">{section.title}</h3>
            <div className="bg-surface rounded-3xl border border-border shadow-soft divide-y divide-border overflow-hidden">
              {section.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <motion.div
                    key={itemIdx}
                    whileHover={{ backgroundColor: 'rgba(0,0,0,0.015)' }}
                    onClick={() => {
                      if (item.href !== '#') router.push(item.href);
                      else addNotification('info', `${item.title} settings are configured for default Coimbatore region.`);
                    }}
                    className="p-5 flex items-center justify-between cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-background group-hover:bg-primary/5 text-primary flex items-center justify-center transition-colors">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-base group-hover:text-secondary transition-colors font-manrope">{item.title}</h4>
                        <p className="text-xs font-medium text-text-secondary mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-text-secondary group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}

        {/* Logout Section */}
        <div className="pt-4">
          <button 
            onClick={handleLogout}
            className="w-full p-5 bg-red-50 hover:bg-red-100/80 text-danger rounded-2xl font-bold flex items-center justify-center gap-3 transition-colors shadow-sm font-manrope touch-target"
          >
            <LogOut size={20} /> Sign Out of Loopra Account
          </button>
        </div>
      </div>
    </div>
  );
}

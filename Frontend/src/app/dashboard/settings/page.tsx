"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Bell, 
  Shield, 
  Lock, 
  Palette, 
  Globe, 
  CreditCard, 
  Car, 
  HelpCircle, 
  FileText, 
  Info, 
  LogOut, 
  ChevronRight, 
  User, 
  Sliders,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { authService } from '@/services/auth.service';
import { useRouter } from 'next/navigation';
import { BecomeDriverModal } from '@/components/BecomeDriverModal';

export default function SettingsPage() {
  const router = useRouter();
  const { clearCredentials, user } = useAuthStore();
  const { addNotification } = useNotificationStore();
  const [showDriverModal, setShowDriverModal] = useState(false);

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
    <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-surface space-y-8">
      {/* Page Title Header */}
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">System Settings</h1>
          <p className="text-gray-500 font-medium text-sm mt-1">Manage your application preferences and security.</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Become a Driver Promo Banner */}
        {user?.role !== 'DRIVER' && (
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-[#112E81] via-[#4647AE] to-[#4382DF] rounded-[32px] p-8 text-white shadow-xl relative overflow-hidden flex flex-col sm:flex-row justify-between items-center gap-6"
          >
            <div className="space-y-2 z-10 text-center sm:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-wider text-yellow-300">
                <Sparkles size={14} /> Earn with Loopra
              </div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight">Become a Loopra Partner Driver</h2>
              <p className="text-white/80 text-sm max-w-lg">
                Drive in Coimbatore with flexible hours, guaranteed round-trip matching, and instant weekly payouts.
              </p>
            </div>
            <button 
              onClick={() => setShowDriverModal(true)}
              className="z-10 px-8 py-4 bg-white text-primary rounded-2xl font-black text-sm shadow-2xl hover:bg-surface transition-all transform hover:scale-105 shrink-0 flex items-center gap-2"
            >
              <Car size={18} /> Apply Now
            </button>
            <div className="absolute right-[-40px] bottom-[-40px] w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
          </motion.div>
        )}

        {/* Settings Categories */}
        {sections.map((section, idx) => (
          <div key={idx} className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 px-2">{section.title}</h3>
            <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
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
                      <div className="w-12 h-12 rounded-2xl bg-surface group-hover:bg-primary/5 text-primary flex items-center justify-center transition-colors">
                        <Icon size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-primary text-base group-hover:text-[#4647AE] transition-colors">{item.title}</h4>
                        <p className="text-xs font-medium text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-primary transition-colors group-hover:translate-x-1 duration-200" />
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
            className="w-full p-5 bg-red-50 hover:bg-red-100/80 text-red-600 rounded-[24px] font-bold flex items-center justify-center gap-3 transition-colors shadow-sm"
          >
            <LogOut size={20} /> Sign Out of Loopra Account
          </button>
        </div>
      </div>

      {/* Driver Registration Modal */}
      {showDriverModal && (
        <BecomeDriverModal onClose={() => setShowDriverModal(false)} />
      )}
    </div>
  );
}

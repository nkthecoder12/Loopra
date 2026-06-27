"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { userService } from '@/services/user.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Award, Calendar, CreditCard, ShieldCheck, Star, UserCheck, Wallet } from 'lucide-react';

export default function ProfilePage() {
  const { user, setCredentials, token } = useAuthStore();
  const { isLoading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  
  const [imageError, setImageError] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    profileImage: user?.profileImage || ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setFormData({
          name: data.name || user?.name || '',
          email: data.email || user?.email || '',
          phone: data.phone || '',
          profileImage: data.profileImage || ''
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchProfile();
  }, [addNotification, user?.email, user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setLoading(true);

    try {
      const updatedUser = await userService.updateProfile(formData);
      addNotification('success', 'Profile updated successfully');
      if (token) {
        setCredentials(updatedUser, token);
      }
    } catch (error: unknown) {
      const errObj = error as { response?: { data?: { message?: string } } };
      addNotification('error', errObj.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (nameStr: string, emailStr: string) => {
    if (nameStr.trim()) {
      const parts = nameStr.trim().split(' ');
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return nameStr.substring(0, 2).toUpperCase();
    }
    if (emailStr.trim()) return emailStr.substring(0, 2).toUpperCase();
    return 'NK';
  };

  const initials = getInitials(formData.name, formData.email);

  return (
    <div className="flex-1 p-4 sm:p-8 md:p-10 overflow-y-auto bg-slate-50 space-y-6 pb-20 md:pb-10">
      {/* Top Banner Card */}
      <div className="max-w-4xl mx-auto bg-black rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6 border border-zinc-800">
        <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 sm:gap-6 z-10 w-full md:w-auto">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-zinc-800 border-4 border-zinc-700 flex items-center justify-center text-2xl sm:text-3xl font-black text-white shadow-2xl overflow-hidden shrink-0">
            {formData.profileImage && !imageError ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img 
                src={formData.profileImage} 
                alt="Profile" 
                onError={() => setImageError(true)} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <span className="tracking-widest">{initials}</span>
            )}
          </div>
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">{formData.name || 'Rider Profile'}</h1>
              <span className="bg-zinc-800 text-zinc-300 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck size={12} className="text-emerald-400" /> Verified Rider
              </span>
            </div>
            <p className="text-zinc-400 font-medium text-xs sm:text-sm truncate">{formData.email}</p>
            <p className="text-zinc-500 text-[11px] font-medium pt-1 flex items-center justify-center sm:justify-start gap-1.5">
              <Calendar size={12} /> Member of Loopra Mobility • Coimbatore
            </p>
          </div>
        </div>

        <div className="z-10 bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center min-w-[180px] space-y-1">
          <p className="text-xs uppercase tracking-widest text-white/70 font-bold">Loopra Loyalty</p>
          <div className="flex items-center justify-center gap-1 text-yellow-300 font-black text-xl">
            <Award size={20} /> Gold tier
          </div>
          <p className="text-[11px] text-white/80">20% off return rides</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Stats Column */}
        <div className="space-y-6 md:col-span-1">
          {/* Wallet Card */}
          <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm space-y-4">
            <div className="flex justify-between items-center text-gray-400">
              <span className="text-xs font-black uppercase tracking-widest">Loopra Wallet</span>
              <Wallet size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-3xl font-black text-primary">₹1,250.00</p>
              <p className="text-xs text-gray-400 mt-1">Available balance for rides</p>
            </div>
            <button className="w-full py-3 bg-primary/5 text-primary rounded-xl font-bold text-xs hover:bg-primary/10 transition-colors flex items-center justify-center gap-2">
              <CreditCard size={15} /> Add Funds
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="bg-white p-6 rounded-[28px] border border-gray-100 shadow-sm space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Rider Activity</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-surface rounded-xl">
                <span className="text-sm font-bold text-gray-600 flex items-center gap-2"><UserCheck size={16} className="text-primary" /> Total Trips</span>
                <span className="font-black text-primary text-base">28</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-surface rounded-xl">
                <span className="text-sm font-bold text-gray-600 flex items-center gap-2"><Star size={16} className="text-yellow-500" /> Rider Rating</span>
                <span className="font-black text-primary text-base">4.95 ★</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="md:col-span-2 bg-white p-8 rounded-[32px] border border-gray-100 shadow-sm space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-primary">Account Details</h2>
            <p className="text-gray-500 text-sm">Update your personal profile information.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Input 
                label="Full Name" 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe" 
              />
              <Input 
                label="Phone Number" 
                type="tel" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210" 
              />
              <div className="md:col-span-2">
                <Input 
                  label="Email Address" 
                  type="email" 
                  value={formData.email}
                  disabled
                />
                <p className="text-xs text-gray-400 mt-2">Verified login email cannot be changed directly.</p>
              </div>
              <div className="md:col-span-2">
                <Input 
                  label="Profile Avatar Image URL (Optional)" 
                  type="text" 
                  value={formData.profileImage}
                  onChange={(e) => {
                    setImageError(false);
                    setFormData({ ...formData, profileImage: e.target.value });
                  }}
                  placeholder="https://images.cloudinary.com/..." 
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" loading={isLoading} disabled={isLoading} className="px-10 h-12">
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

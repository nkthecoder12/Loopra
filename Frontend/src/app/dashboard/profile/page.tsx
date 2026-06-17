"use client";

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { userService } from '@/services/user.service';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function ProfilePage() {
  const { user, setCredentials, token } = useAuthStore();
  const { isLoading, setLoading } = useAppStore();
  const { addNotification } = useNotificationStore();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await userService.getProfile();
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          profileImage: data.profileImage || ''
        });
      } catch (err) {
        addNotification('error', 'Failed to load profile');
      }
    };
    fetchProfile();
  }, [addNotification]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setLoading(true);

    try {
      const updatedUser = await userService.updateProfile(formData);
      addNotification('success', 'Profile updated successfully');
      if (token) {
        // Update local auth store with new user data
        setCredentials(updatedUser, token);
      }
    } catch (err: any) {
      addNotification('error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-surface">
      <div className="max-w-2xl mx-auto space-y-8 bg-white p-8 rounded-[32px] shadow-sm">
        <div>
          <h2 className="text-3xl font-bold text-primary">Profile Details</h2>
          <p className="text-gray-500">Manage your account information.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-surface rounded-full flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
              {formData.profileImage ? (
                <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-bold text-gray-400">{formData.name?.[0]?.toUpperCase() || 'U'}</span>
              )}
            </div>
            <div className="flex-1">
              <Input 
                label="Profile Image URL (Cloudinary ready)" 
                type="text" 
                value={formData.profileImage}
                onChange={(e) => setFormData({ ...formData, profileImage: e.target.value })}
                placeholder="https://..." 
              />
            </div>
          </div>

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
              placeholder="+1 234 567 8900" 
            />
            <div className="md:col-span-2">
              <Input 
                label="Email Address" 
                type="email" 
                value={formData.email}
                disabled
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-2">Email address cannot be changed.</p>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" loading={isLoading} disabled={isLoading} className="px-8">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

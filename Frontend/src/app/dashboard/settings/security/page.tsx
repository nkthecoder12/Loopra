"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useNotificationStore } from '@/store/useNotificationStore';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      addNotification('error', 'Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmPassword) {
      addNotification('error', 'New passwords do not match.');
      return;
    }

    if (newPassword.length < 6) {
      addNotification('error', 'Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800)); // Simulate delay
      
      // TODO: Integrate actual password update API when backend supports credential edits
      // Example: await authService.changePassword({ currentPassword, newPassword });
      
      addNotification('info', 'Backend integration pending.');
    } catch {
      addNotification('error', 'Failed to change password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-background space-y-8 font-inter">
      <div className="max-w-xl mx-auto space-y-6">
        {/* Back Navigation */}
        <button
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2 text-xs font-bold text-text-secondary hover:text-primary transition-colors touch-target"
        >
          <ArrowLeft size={16} /> Back to Settings
        </button>

        {/* Title Block */}
        <div>
          <h2 className="text-2xl font-black text-primary font-manrope flex items-center gap-2">
            <Lock size={24} className="text-accent" />
            Security & Password
          </h2>
          <p className="text-text-secondary text-xs sm:text-sm font-semibold mt-1">
            Update your account password and manage two-factor credentials.
          </p>
        </div>

        {/* Security Form */}
        <form onSubmit={handleUpdatePassword} className="bg-surface rounded-3xl border border-border p-6 space-y-6 shadow-soft">
          <div className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => router.push('/dashboard/settings')}
              className="px-4 py-2 border border-border text-text-secondary hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary text-white font-bold text-xs rounded-xl hover:bg-secondary transition-all disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Update Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { 
  Users, 
  Car, 
  RotateCcw, 
  TrendingUp, 
  ArrowUpRight, 
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { adminService } from '@/services/admin.service';
import { useNotificationStore } from '@/store/useNotificationStore';

interface AdminUser {
  _id?: string;
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

interface AdminDriver {
  _id?: string;
  id?: string;
  name?: string;
  phone?: string;
  onboardingStatus?: string;
  userId?: {
    name?: string;
    phone?: string;
  };
  vehicle?: {
    type?: string;
    number?: string;
  };
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('Overview');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotificationStore();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'Users') {
        const data = await adminService.getUsers(1, 50);
        setUsers(data?.data?.users || data?.users || data || []);
      } else if (activeTab === 'Drivers' || activeTab === 'Overview') {
        const data = await adminService.getDrivers(1, 50);
        setDrivers(data?.data?.drivers || data?.drivers || data || []);
      }
    } catch (error) {
      console.error('Failed to fetch admin data', error);
      addNotification('error', 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, addNotification]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleApprove = async (id: string) => {
    try {
      await adminService.approveDriver(id);
      addNotification('success', 'Driver approved');
      fetchData();
    } catch (error) {
      console.error('Failed to approve driver', error);
      addNotification('error', 'Failed to approve driver');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await adminService.rejectDriver(id, 'Admin rejected');
      addNotification('success', 'Driver rejected');
      fetchData();
    } catch (error) {
      console.error('Failed to reject driver', error);
      addNotification('error', 'Failed to reject driver');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-100 overflow-hidden">
      {/* Admin Sidebar / Topbar */}
      <nav className="w-full h-16 md:w-64 md:h-full bg-black text-white p-4 md:p-8 space-y-0 md:space-y-12 shrink-0 flex md:flex-col items-center md:items-start justify-between border-b md:border-b-0 md:border-r border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl p-1 flex items-center justify-center shadow-md">
            <Image src="/loopra logo.png" alt="Loopra Logo" width={32} height={32} className="object-contain" priority />
          </div>
          <div className="text-xl md:text-2xl font-black tracking-tighter text-white">Loopra Admin</div>
        </div>
        
        <div className="flex md:flex-col gap-2 md:gap-4 md:w-full">
          {[
            { label: 'Overview', icon: <TrendingUp size={18} /> },
            { label: 'Drivers', icon: <Car size={18} /> },
            { label: 'Users', icon: <Users size={18} /> },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(item.label)}
              className={`flex items-center gap-2.5 px-3.5 py-2 md:px-4 md:py-3 rounded-xl text-xs md:text-sm font-bold transition-all touch-target ${activeTab === item.label ? 'bg-white text-black shadow-md' : 'text-zinc-400 hover:text-white hover:bg-zinc-900'}`}
            >
              {item.icon}
              <span className="hidden sm:inline md:inline">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-8 md:p-12 space-y-8 md:space-y-12">
        <header className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-black tracking-tight">{activeTab}</h1>
            <p className="text-slate-500 font-medium text-xs sm:text-sm">Real-time mobility platform dashboard</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 text-xs font-bold bg-white text-black border-slate-200 hover:bg-slate-50" onClick={fetchData}>
              <RotateCcw size={16} className="mr-2" /> Refresh
            </Button>
            <Button className="h-11 text-xs font-bold bg-black text-white hover:bg-zinc-800">
              System Health: Stable
            </Button>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { label: 'Total Users', value: users.length || '--', change: '+12.5%', icon: <Users size={20} /> },
              { label: 'Total Drivers', value: drivers.length || '--', change: '+4.2%', icon: <Car size={20} /> },
              { label: 'Pending Approvals', value: drivers.filter(d => d.onboardingStatus === 'PENDING').length || '0', change: 'Action Req', icon: <RotateCcw size={20} /> },
              { label: 'System Status', value: 'Online', change: 'All Good', icon: <TrendingUp size={20} /> },
            ].map((stat, i) => (
              <div key={i} className="flex flex-col justify-between bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-slate-100 text-black rounded-2xl">
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1 text-emerald-600 text-xs font-black">
                    <ArrowUpRight size={12} />
                    {stat.change}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-black mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drivers Table */}
        {activeTab === 'Drivers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">Driver Management</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5">Driver Name</th>
                    <th className="p-5">Phone</th>
                    <th className="p-5">Status</th>
                    <th className="p-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-black">
                  {drivers.length > 0 ? drivers.map((driver) => (
                    <tr key={driver._id || driver.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold">{driver.name || 'Partner Driver'}</td>
                      <td className="p-5 text-slate-500 font-mono text-xs">{driver.phone || 'N/A'}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          driver.onboardingStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                          driver.onboardingStatus === 'REJECTED' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {driver.onboardingStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="p-5 text-right space-x-2">
                        {driver.onboardingStatus !== 'APPROVED' && (
                          <button 
                            onClick={() => driver._id && handleApprove(driver._id)} 
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors touch-target"
                            title="Approve Driver"
                          >
                            <CheckCircle size={20} />
                          </button>
                        )}
                        {driver.onboardingStatus !== 'REJECTED' && (
                          <button 
                            onClick={() => driver._id && handleReject(driver._id)} 
                            className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors touch-target"
                            title="Reject Driver"
                          >
                            <XCircle size={20} />
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-medium">No drivers registered yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'Users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-black">Registered Users</h2>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-x-auto">
              <table className="w-full text-left min-w-[600px]">
                <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100">
                  <tr>
                    <th className="p-5">User Name</th>
                    <th className="p-5">Email</th>
                    <th className="p-5">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-semibold text-black">
                  {users.length > 0 ? users.map((u) => (
                    <tr key={u._id || u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-5 font-bold">{u.name || 'Rider'}</td>
                      <td className="p-5 text-slate-500 font-mono text-xs">{u.email}</td>
                      <td className="p-5">
                        <span className="px-3 py-1 bg-slate-100 text-slate-800 rounded-full text-[10px] font-black uppercase tracking-wider">
                          {u.role || 'USER'}
                        </span>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 font-medium">No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

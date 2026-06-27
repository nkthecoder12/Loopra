"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
    <div className="flex h-screen bg-surface">
      {/* Admin Sidebar */}
      <nav className="w-64 bg-primary text-white p-8 space-y-12 shrink-0">
        <div className="text-3xl font-black tracking-tighter italic">Drivo Admin.</div>
        
        <div className="space-y-4">
          {[
            { label: 'Overview', icon: <TrendingUp size={20} /> },
            { label: 'Drivers', icon: <Car size={20} /> },
            { label: 'Users', icon: <Users size={20} /> },
          ].map((item, i) => (
            <button 
              key={i} 
              onClick={() => setActiveTab(item.label)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all ${activeTab === item.label ? 'bg-white text-primary' : 'text-white/60 hover:bg-white/10'}`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-12 space-y-12">
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-black text-primary tracking-tight">{activeTab}</h1>
            <p className="text-gray-500 font-medium">Real-time system management</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-12" onClick={fetchData}><RotateCcw size={18} className="mr-2" /> Refresh</Button>
            <Button className="h-12">System Health: Stable</Button>
          </div>
        </header>

        {activeTab === 'Overview' && (
          <div className="grid grid-cols-4 gap-8">
            {[
              { label: 'Total Users', value: users.length || '--', change: '+12.5%', icon: <Users /> },
              { label: 'Total Drivers', value: drivers.length || '--', change: '+4.2%', icon: <Car /> },
              { label: 'Pending Approvals', value: drivers.filter(d => d.onboardingStatus === 'PENDING').length || '0', change: 'Action Req', icon: <RotateCcw /> },
              { label: 'System Status', value: 'Online', change: 'All Good', icon: <TrendingUp /> },
            ].map((stat, i) => (
              <div key={i} className="uber-card flex flex-col justify-between bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-primary/5 text-primary rounded-xl">
                    {stat.icon}
                  </div>
                  <div className="flex items-center gap-1 text-green-600 text-xs font-black">
                    <ArrowUpRight size={12} />
                    {stat.change}
                  </div>
                </div>
                <div className="mt-6">
                  <p className="text-gray-400 text-xs font-black uppercase tracking-widest">{stat.label}</p>
                  <p className="text-3xl font-black text-primary mt-1">{stat.value}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Drivers Table */}
        {activeTab === 'Drivers' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">Driver Management</h2>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-surface text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">Driver</th>
                    <th className="px-8 py-6">Phone</th>
                    <th className="px-8 py-6">Vehicle</th>
                    <th className="px-8 py-6">Status</th>
                    <th className="px-8 py-6">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : drivers.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No drivers found</td></tr>
                  ) : drivers.map((driver) => (
                    <tr key={driver._id || driver.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                            {driver.name?.[0] || driver.userId?.name?.[0] || 'D'}
                          </div>
                          <p className="font-bold text-primary">{driver.name || driver.userId?.name || 'Unknown'}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-medium text-gray-500 text-sm">{driver.phone || driver.userId?.phone || 'N/A'}</p>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-medium text-gray-500 text-sm">
                          {driver.vehicle ? `${driver.vehicle.type} - ${driver.vehicle.number}` : 'Not specified'}
                        </p>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          driver.onboardingStatus === 'APPROVED' ? 'bg-green-50 text-green-600' :
                          driver.onboardingStatus === 'PENDING' ? 'bg-yellow-50 text-yellow-600' :
                          'bg-red-50 text-red-600'
                        }`}>
                          {driver.onboardingStatus || 'PENDING'}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {driver.onboardingStatus === 'PENDING' && (
                          <div className="flex gap-2">
                            <button onClick={() => handleApprove(driver._id || driver.id || '')} className="p-2 bg-green-50 text-green-600 rounded hover:bg-green-100">
                              <CheckCircle size={18} />
                            </button>
                            <button onClick={() => handleReject(driver._id || driver.id || '')} className="p-2 bg-red-50 text-red-600 rounded hover:bg-red-100">
                              <XCircle size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Users Table */}
        {activeTab === 'Users' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-primary">User Management</h2>
            </div>

            <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-surface text-gray-400 text-[10px] font-black uppercase tracking-widest">
                  <tr>
                    <th className="px-8 py-6">User</th>
                    <th className="px-8 py-6">Email</th>
                    <th className="px-8 py-6">Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loading ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">Loading...</td></tr>
                  ) : users.length === 0 ? (
                    <tr><td colSpan={3} className="text-center py-8 text-gray-400">No users found</td></tr>
                  ) : users.map((u) => (
                    <tr key={u._id || u.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-surface rounded-lg flex items-center justify-center font-bold text-xs uppercase">
                            {u.name?.[0] || 'U'}
                          </div>
                          <p className="font-bold text-primary">{u.name}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="font-medium text-gray-500 text-sm">{u.email}</p>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase">
                          {u.role}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

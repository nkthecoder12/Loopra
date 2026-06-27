"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { driverService } from '@/services/driver.service';
import { useNotificationStore } from '@/store/useNotificationStore';
import { Upload, FileText, CheckCircle, XCircle } from 'lucide-react';

export default function DriverOnboardingPage() {
  const router = useRouter();
  const { addNotification } = useNotificationStore();
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    vehicleType: 'economy',
    vehicleNumber: ''
  });

  const [files, setFiles] = useState<{
    license: File | null;
    rc: File | null;
  }>({ license: null, rc: null });

  const [previews, setPreviews] = useState<{
    license: string | null;
    rc: string | null;
  }>({ license: null, rc: null });

  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PENDING' | 'APPROVED' | 'REJECTED'>('IDLE');
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'license' | 'rc') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)) {
      addNotification('error', 'Invalid file type. Please upload JPG, PNG, or PDF.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) { // 5MB
      addNotification('error', 'File size exceeds 5MB limit.');
      return;
    }

    setFiles(prev => ({ ...prev, [type]: file }));

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviews(prev => ({ ...prev, [type]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews(prev => ({ ...prev, [type]: 'PDF' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!files.license || !files.rc) {
      addNotification('error', 'Please upload all required documents.');
      return;
    }

    setStatus('UPLOADING');
    setProgress(0);

    // Simulate progress while uploading
    const progressInterval = setInterval(() => {
      setProgress(p => (p >= 90 ? 90 : p + 10));
    }, 200);

    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('phone', formData.phone);
      data.append('vehicleType', formData.vehicleType);
      data.append('vehicleNumber', formData.vehicleNumber);
      data.append('license', files.license);
      data.append('rc', files.rc);

      await driverService.onboard(data);
      clearInterval(progressInterval);
      setProgress(100);
      setStatus('PENDING');
      addNotification('success', 'Onboarding submitted successfully!');
    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      setStatus('IDLE');
      setProgress(0);
      addNotification('error', 'Failed to submit onboarding details. Please try again.');
    }
  };

  if (status === 'PENDING' || status === 'APPROVED' || status === 'REJECTED') {
    return (
      <div className="flex-1 min-h-screen flex items-center justify-center bg-surface p-6 sm:p-10">
        <div className="max-w-xl w-full bg-white rounded-[32px] p-8 text-center space-y-8 shadow-2xl border border-gray-100">
          {status === 'PENDING' && (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ClockIcon />
              </div>
              <div>
                <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1.5 rounded-full font-black uppercase tracking-widest">
                  Verification Pending
                </span>
                <h2 className="text-3xl font-black text-primary tracking-tight mt-3">Application Under Review</h2>
                <p className="text-gray-500 text-sm mt-1 max-w-md mx-auto">
                  Our Coimbatore RTO verification team is reviewing your uploaded Licence and Vehicle RC.
                </p>
              </div>

              <div className="bg-surface p-6 rounded-3xl text-left space-y-4 border border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Application Status & Timeline</h4>
                <div className="space-y-3.5 text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                    <span>Personal Details & Identity Submitted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                    <span>Licence & Vehicle RC Uploaded</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-[10px] animate-pulse">⏳</div>
                    <span>Coimbatore RTO & Background Verification</span>
                  </div>
                </div>
                <div className="pt-3 border-t flex justify-between items-center text-xs">
                  <span className="text-gray-400">Est. Review Time:</span>
                  <span className="font-bold text-primary">24–48 Hours</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50/60 rounded-2xl text-xs text-blue-900 flex justify-between items-center">
                <span>Need assistance with your application?</span>
                <a href="mailto:support@loopra.in" className="font-bold text-primary hover:underline">Support Contact</a>
              </div>

              <Button onClick={() => router.push('/dashboard')} className="w-full h-12">
                Return to Rider Dashboard
              </Button>
            </div>
          )}
          {status === 'APPROVED' && (
            <>
              <div className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold">Approved!</h2>
              <p className="text-gray-500">Welcome to Loopra Coimbatore! You can now start accepting rides.</p>
              <Button onClick={() => router.push('/driver')} className="w-full h-12">Go to Driver Dashboard</Button>
            </>
          )}
          {status === 'REJECTED' && (
            <>
              <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto">
                <XCircle size={40} />
              </div>
              <h2 className="text-2xl font-bold">Verification Failed</h2>
              <p className="text-gray-500">Unfortunately, we could not verify your documents. Please review and try again.</p>
              <Button onClick={() => setStatus('IDLE')} className="w-full h-12">Try Again</Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-screen bg-surface p-8 flex justify-center">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="bg-primary p-8 text-white">
          <h1 className="text-3xl font-bold">Driver Onboarding</h1>
          <p className="text-white/80 mt-2">Join our network of premium drivers.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Full Name" 
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required 
              />
              <Input 
                label="Phone Number" 
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Vehicle Type</label>
                <select
                  value={formData.vehicleType}
                  onChange={e => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full h-12 px-4 border border-gray-200 rounded-xl outline-none focus:border-primary transition-colors bg-white text-sm"
                  required
                >
                  <option value="economy">Economy</option>
                  <option value="premium">Premium</option>
                  <option value="suv">SUV</option>
                </select>
              </div>
              <Input 
                label="Vehicle Number" 
                value={formData.vehicleNumber}
                onChange={e => setFormData({ ...formData, vehicleNumber: e.target.value })}
                required 
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-lg border-b pb-2">Documents (Max 5MB, JPG/PNG/PDF)</h3>
            
            <div className="grid grid-cols-2 gap-6">
              {/* License Upload */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Driving License</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-surface transition-colors">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFileChange(e, 'license')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previews.license ? (
                    previews.license === 'PDF' ? (
                      <div className="flex flex-col items-center">
                        <FileText size={32} className="text-primary mb-2" />
                        <span className="text-xs font-bold text-primary">{files.license?.name}</span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={previews.license} alt="License preview" className="max-h-24 mx-auto rounded" />
                    )
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Upload size={24} className="mb-2" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                </div>
              </div>

              {/* RC Upload */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Vehicle RC</label>
                <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:bg-surface transition-colors">
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,application/pdf"
                    onChange={(e) => handleFileChange(e, 'rc')}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  {previews.rc ? (
                    previews.rc === 'PDF' ? (
                      <div className="flex flex-col items-center">
                        <FileText size={32} className="text-primary mb-2" />
                        <span className="text-xs font-bold text-primary">{files.rc?.name}</span>
                      </div>
                    ) : (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={previews.rc} alt="RC preview" className="max-h-24 mx-auto rounded" />
                    )
                  ) : (
                    <div className="flex flex-col items-center text-gray-500">
                      <Upload size={24} className="mb-2" />
                      <span className="text-xs">Click to upload</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {status === 'UPLOADING' && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold">
                <span>Uploading documents...</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 bg-surface rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            </div>
          )}

          <Button 
            className="w-full h-14 text-lg" 
            disabled={status === 'UPLOADING' || !files.license || !files.rc || !formData.name || !formData.phone || !formData.vehicleType || !formData.vehicleNumber}
          >
            Submit Application
          </Button>
        </form>
      </div>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
}

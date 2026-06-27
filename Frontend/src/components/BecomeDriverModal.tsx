"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  User, 
  FileText, 
  Car, 
  CreditCard, 
  ShieldCheck, 
  Upload, 
  Sparkles,
  Phone,
  Calendar,
  MapPin
} from 'lucide-react';
import { useNotificationStore } from '@/store/useNotificationStore';

interface BecomeDriverModalProps {
  onClose: () => void;
}

interface DriverFormData {
  // Step 1: Personal
  name: string;
  phone: string;
  dob: string;
  address: string;
  emergencyContact: string;
  
  // Step 2: Licence
  licenceNumber: string;
  licenceExpiry: string;
  licenceFrontName: string;
  licenceBackName: string;

  // Step 3: Vehicle
  vehicleType: string;
  vehicleNumber: string;
  rcNumber: string;
  insuranceExpiry: string;
  vehiclePhotoName: string;

  // Step 4: Bank Details
  upiId: string;
  bankName: string;
  ifscCode: string;
  accountNumber: string;

  // Step 5: Terms
  agreedTerms: boolean;
}

const STORAGE_KEY = 'loopra_driver_application_draft';

const INITIAL_DATA: DriverFormData = {
  name: '',
  phone: '',
  dob: '',
  address: 'Coimbatore, Tamil Nadu',
  emergencyContact: '',
  licenceNumber: '',
  licenceExpiry: '',
  licenceFrontName: '',
  licenceBackName: '',
  vehicleType: 'car',
  vehicleNumber: '',
  rcNumber: '',
  insuranceExpiry: '',
  vehiclePhotoName: '',
  upiId: '',
  bankName: '',
  ifscCode: '',
  accountNumber: '',
  agreedTerms: false,
};

export const BecomeDriverModal = ({ onClose }: BecomeDriverModalProps) => {
  const [step, setStep] = useState<number>(1);
  const [submitted, setSubmitted] = useState(false);
  const { addNotification } = useNotificationStore();

  const [formData, setFormData] = useState<DriverFormData>(() => {
    if (typeof window === 'undefined') return INITIAL_DATA;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? { ...INITIAL_DATA, ...JSON.parse(saved) } : INITIAL_DATA;
    } catch {
      return INITIAL_DATA;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
    } catch (e) {
      console.error(e);
    }
  }, [formData]);

  const updateField = (field: keyof DriverFormData, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (currentStep: number): boolean => {
    if (currentStep === 1) {
      if (!formData.name.trim() || !formData.phone.trim() || !formData.dob) {
        addNotification('error', 'Please fill all required personal details.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!formData.licenceNumber.trim() || !formData.licenceExpiry) {
        addNotification('error', 'Please enter your driving licence information.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!formData.vehicleNumber.trim() || !formData.rcNumber.trim()) {
        addNotification('error', 'Please enter your vehicle & RC information.');
        return false;
      }
    } else if (currentStep === 4) {
      if (!formData.accountNumber.trim() || !formData.ifscCode.trim()) {
        addNotification('error', 'Please provide valid bank account details.');
        return false;
      }
    } else if (currentStep === 5) {
      if (!formData.agreedTerms) {
        addNotification('error', 'You must agree to the Loopra Partner terms.');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      if (step < 5) setStep(step + 1);
      else handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    localStorage.removeItem(STORAGE_KEY);
    addNotification('success', 'Driver Application Submitted for Verification!');
  };

  const stepsHeader = [
    { title: 'Personal', icon: User },
    { title: 'Licence', icon: FileText },
    { title: 'Vehicle', icon: Car },
    { title: 'Bank', icon: CreditCard },
    { title: 'Verify', icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-[#112E81]/40 backdrop-blur-md animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-white rounded-[36px] shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Top Banner Header */}
        <div className="bg-gradient-to-r from-[#112E81] via-[#4647AE] to-[#4382DF] p-6 text-white relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-2 text-yellow-300 text-xs font-bold uppercase tracking-widest mb-1">
            <Sparkles size={14} /> Partner Registration
          </div>
          <h2 className="text-2xl font-black tracking-tight">Become a Loopra Driver</h2>
          <p className="text-xs text-white/80 mt-0.5">Coimbatore City Operation • Fast Verification</p>

          {/* Progress Bar Header */}
          {!submitted && (
            <div className="mt-6 pt-4 border-t border-white/15 grid grid-cols-5 gap-2 text-center">
              {stepsHeader.map((st, idx) => {
                const stepNum = idx + 1;
                const Icon = st.icon;
                const active = stepNum === step;
                const done = stepNum < step;
                return (
                  <div key={idx} className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      done ? 'bg-green-400 text-black' :
                      active ? 'bg-white text-primary ring-4 ring-white/20 scale-110' :
                      'bg-white/10 text-white/60'
                    }`}>
                      {done ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    <span className={`text-[10px] font-bold tracking-wider uppercase hidden sm:inline ${
                      active ? 'text-white' : 'text-white/60'
                    }`}>
                      {st.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Main Form Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1">
          {submitted ? (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center space-y-6 py-6">
              <div className="w-20 h-20 bg-yellow-100 text-yellow-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck size={44} />
              </div>
              <div className="space-y-2">
                <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded-full font-black uppercase tracking-widest">
                  Verification Pending
                </span>
                <h3 className="text-3xl font-black text-primary tracking-tight mt-2">Application Submitted!</h3>
                <p className="text-gray-500 text-sm max-w-md mx-auto">
                  Thank you for applying to drive with Loopra in Coimbatore. Our operations team is verifying your RC, Licence, and bank documents.
                </p>
              </div>

              <div className="bg-surface p-6 rounded-3xl text-left max-w-md mx-auto space-y-4 border border-gray-100">
                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400">Application Timeline</h4>
                <div className="space-y-3 text-xs font-bold text-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                    <span>Documents Uploaded Successfully</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-yellow-500 text-white rounded-full flex items-center justify-center text-[10px]">⏳</div>
                    <span>Background Verification in Progress</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400">
                    <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center text-[10px]">3</div>
                    <span>Account Activation & Driver App Access</span>
                  </div>
                </div>
                <div className="pt-2 text-[11px] text-gray-400 text-center border-t">
                  Estimated review time: <strong>24–48 hours</strong>
                </div>
              </div>

              <button 
                onClick={onClose}
                className="px-8 py-3.5 bg-primary text-white font-bold rounded-2xl text-sm shadow-lg hover:bg-primary/95 transition-all"
              >
                Return to Dashboard
              </button>
            </motion.div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                
                {/* STEP 1: PERSONAL DETAILS */}
                {step === 1 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary">Step 1: Personal Details</h3>
                      <p className="text-xs text-gray-500">Enter your official contact and identity information.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Full Name (as on Licence)*</label>
                        <div className="relative">
                          <User size={16} className="absolute left-3 top-3.5 text-gray-400" />
                          <input 
                            type="text" 
                            value={formData.name}
                            onChange={e => updateField('name', e.target.value)}
                            placeholder="John Doe" 
                            className="w-full pl-9 pr-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Phone Number*</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                          <input 
                            type="tel" 
                            value={formData.phone}
                            onChange={e => updateField('phone', e.target.value)}
                            placeholder="+91 98765 43210" 
                            className="w-full pl-9 pr-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Date of Birth*</label>
                        <div className="relative">
                          <Calendar size={16} className="absolute left-3 top-3.5 text-gray-400" />
                          <input 
                            type="date" 
                            value={formData.dob}
                            onChange={e => updateField('dob', e.target.value)}
                            className="w-full pl-9 pr-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Emergency Contact Number</label>
                        <div className="relative">
                          <Phone size={16} className="absolute left-3 top-3.5 text-gray-400" />
                          <input 
                            type="tel" 
                            value={formData.emergencyContact}
                            onChange={e => updateField('emergencyContact', e.target.value)}
                            placeholder="+91 91234 56789" 
                            className="w-full pl-9 pr-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="text-xs font-bold text-gray-600">Residential Address (Coimbatore Region)</label>
                        <div className="relative">
                          <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
                          <input 
                            type="text" 
                            value={formData.address}
                            onChange={e => updateField('address', e.target.value)}
                            className="w-full pl-9 pr-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 2: DRIVING LICENCE */}
                {step === 2 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary">Step 2: Driving Licence Details</h3>
                      <p className="text-xs text-gray-500">Provide valid RTO licence details.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Licence Number*</label>
                        <input 
                          type="text" 
                          value={formData.licenceNumber}
                          onChange={e => updateField('licenceNumber', e.target.value.toUpperCase())}
                          placeholder="TN37 20210012345" 
                          className="w-full px-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Licence Expiry Date*</label>
                        <input 
                          type="date" 
                          value={formData.licenceExpiry}
                          onChange={e => updateField('licenceExpiry', e.target.value)}
                          className="w-full px-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-surface transition-colors cursor-pointer">
                        <Upload size={24} className="mx-auto text-primary mb-2" />
                        <p className="text-xs font-bold text-primary">Upload Licence Front</p>
                        <p className="text-[10px] text-gray-400 mt-1">JPG, PNG or PDF (Max 5MB)</p>
                      </div>
                      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center hover:bg-surface transition-colors cursor-pointer">
                        <Upload size={24} className="mx-auto text-primary mb-2" />
                        <p className="text-xs font-bold text-primary">Upload Licence Back</p>
                        <p className="text-[10px] text-gray-400 mt-1">JPG, PNG or PDF (Max 5MB)</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3: VEHICLE INFORMATION */}
                {step === 3 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary">Step 3: Vehicle & RC Details</h3>
                      <p className="text-xs text-gray-500">Select vehicle category and enter RC registration details.</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { id: 'bike', label: 'Bike' },
                        { id: 'auto', label: 'Auto' },
                        { id: 'car', label: 'Sedan/Hatch' },
                        { id: 'suv', label: 'SUV Premium' },
                      ].map((type) => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => updateField('vehicleType', type.id)}
                          className={`p-3 rounded-xl border font-bold text-xs text-center transition-all ${
                            formData.vehicleType === type.id ? 'border-primary bg-primary/10 text-primary ring-2 ring-primary/20' : 'border-gray-200 text-gray-600 hover:bg-surface'
                          }`}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Vehicle Registration Number*</label>
                        <input 
                          type="text" 
                          value={formData.vehicleNumber}
                          onChange={e => updateField('vehicleNumber', e.target.value.toUpperCase())}
                          placeholder="TN 37 AB 1234" 
                          className="w-full px-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">RC Book Number*</label>
                        <input 
                          type="text" 
                          value={formData.rcNumber}
                          onChange={e => updateField('rcNumber', e.target.value.toUpperCase())}
                          placeholder="RC123456789" 
                          className="w-full px-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 4: BANK DETAILS */}
                {step === 4 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary">Step 4: Bank & Payout Details</h3>
                      <p className="text-xs text-gray-500">Weekly earnings will be directly credited here.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">Account Number*</label>
                        <input 
                          type="text" 
                          value={formData.accountNumber}
                          onChange={e => updateField('accountNumber', e.target.value)}
                          placeholder="918273645019" 
                          className="w-full px-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-600">IFSC Code*</label>
                        <input 
                          type="text" 
                          value={formData.ifscCode}
                          onChange={e => updateField('ifscCode', e.target.value.toUpperCase())}
                          placeholder="SBIN0001234" 
                          className="w-full px-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                        />
                      </div>
                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-xs font-bold text-gray-600">UPI ID for instant payouts (Optional)</label>
                        <input 
                          type="text" 
                          value={formData.upiId}
                          onChange={e => updateField('upiId', e.target.value)}
                          placeholder="driver@okaxis" 
                          className="w-full px-4 py-3 border rounded-xl text-sm font-semibold outline-none focus:border-primary"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5: VERIFICATION SUMMARY */}
                {step === 5 && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold text-primary">Step 5: Review & Confirm</h3>
                      <p className="text-xs text-gray-500">Review your application before final submission.</p>
                    </div>

                    <div className="bg-surface p-5 rounded-2xl space-y-3 text-xs text-gray-700 border border-gray-100">
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-bold">Applicant Name:</span>
                        <span>{formData.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-bold">Phone Number:</span>
                        <span>{formData.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-bold">Licence Number:</span>
                        <span>{formData.licenceNumber || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between border-b pb-2">
                        <span className="font-bold">Vehicle Number:</span>
                        <span>{formData.vehicleNumber || 'N/A'} ({formData.vehicleType.toUpperCase()})</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-bold">Bank IFSC / Acc:</span>
                        <span>{formData.ifscCode} / ••••{formData.accountNumber.slice(-4)}</span>
                      </div>
                    </div>

                    <label className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.agreedTerms} 
                        onChange={e => updateField('agreedTerms', e.target.checked)}
                        className="mt-1 rounded border-gray-300 text-primary focus:ring-primary" 
                      />
                      <span className="text-xs text-gray-600">
                        I declare that the information and RTO documents provided are authentic. I agree to Loopra Coimbatore Driver Partner Code of Conduct.
                      </span>
                    </label>
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Modal Bottom Action Bar */}
        {!submitted && (
          <div className="p-5 bg-surface border-t border-gray-100 flex justify-between items-center shrink-0">
            <button
              onClick={handleBack}
              disabled={step === 1}
              className={`px-5 py-3 rounded-xl font-bold text-xs flex items-center gap-2 transition-colors ${
                step === 1 ? 'opacity-0 cursor-default' : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              <ArrowLeft size={16} /> Back
            </button>

            <button
              onClick={handleNext}
              className="px-8 py-3.5 bg-primary text-white font-bold rounded-2xl text-xs shadow-lg hover:bg-primary/95 transition-all flex items-center gap-2"
            >
              {step === 5 ? 'Submit Application' : 'Continue'} <ArrowRight size={16} />
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

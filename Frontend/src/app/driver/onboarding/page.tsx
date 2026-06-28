"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  FileText,
  Car,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Upload,
  Trash2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { driverService } from "@/services/driver.service";
import { useNotificationStore } from "@/store/useNotificationStore";
import { useAuthStore } from "@/store/useAuthStore";

interface DocFileMeta {
  file: File | null;
  previewUrl: string | null;
  existingUrl?: string | null;
  verificationStatus?: string;
  reviewNotes?: string;
}

interface ApplicationDataRecord {
  _id?: string;
  status?: string;
  reviewComments?: string;
  personalDetails?: Record<string, unknown>;
  licenseDetails?: Record<string, unknown>;
  vehicleDetails?: Record<string, unknown>;
  bankDetails?: Record<string, unknown>;
  documents?: Record<string, unknown>;
}

const DRAFT_STORAGE_KEY = "loopra_driver_onboarding_draft";

export default function DriverOnboardingPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { addNotification } = useNotificationStore();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("IDLE");
  const [applicationData, setApplicationData] = useState<ApplicationDataRecord | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form State
  const [personal, setPersonal] = useState({
    fullName: user?.name || "",
    phone: "",
    email: user?.email || "",
    dob: "",
    gender: "male",
    address: "",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "",
    emergencyContact: "",
  });

  const [license, setLicense] = useState({
    licenseNumber: "",
    issueDate: "",
    expiryDate: "",
  });

  const [vehicle, setVehicle] = useState({
    vehicleType: "car",
    brand: "",
    model: "",
    year: "2023",
    number: "",
    colour: "",
  });

  const [bank, setBank] = useState({
    accountHolder: "",
    accountNumber: "",
    ifsc: "",
    bankName: "",
    branch: "",
    upiId: "",
  });

  // Files State
  const [files, setFiles] = useState<Record<string, DocFileMeta>>({
    profilePhoto: { file: null, previewUrl: null },
    licenseFront: { file: null, previewUrl: null },
    licenseBack: { file: null, previewUrl: null },
    vehiclePhoto: { file: null, previewUrl: null },
    rcBook: { file: null, previewUrl: null },
    insurance: { file: null, previewUrl: null },
    pollutionCertificate: { file: null, previewUrl: null },
    govtId: { file: null, previewUrl: null },
    selfie: { file: null, previewUrl: null },
  });

  // Fetch Existing Application status on load
  useEffect(() => {
    const checkExistingApplication = async () => {
      try {
        const res = await driverService.getApplication();
        if (res && res.application) {
          setApplicationData(res.application);
          setStatus(res.application.status || "PENDING");

          if (res.application.personalDetails) {
            setPersonal((prev) => ({ ...prev, ...(res.application.personalDetails as object) }));
          }
          if (res.application.licenseDetails) {
            const lic = res.application.licenseDetails as Record<string, string>;
            setLicense({
              licenseNumber: lic.licenseNumber || "",
              issueDate: lic.issueDate?.substring(0, 10) || "",
              expiryDate: lic.expiryDate?.substring(0, 10) || "",
            });
          }
          if (res.application.vehicleDetails) {
            setVehicle((prev) => ({ ...prev, ...(res.application.vehicleDetails as object) }));
          }
          if (res.application.bankDetails) {
            setBank((prev) => ({ ...prev, ...(res.application.bankDetails as object) }));
          }

          type DocMetaRecord = Record<string, { url?: string; verificationStatus?: string; reviewNotes?: string }>;
          const docMap = (res.application.documents as DocMetaRecord) || {};
          const licMap = (res.application.licenseDetails as DocMetaRecord) || {};
          const vehMap = (res.application.vehicleDetails as DocMetaRecord) || {};
          const perMap = (res.application.personalDetails as DocMetaRecord) || {};

          setFiles({
            profilePhoto: { file: null, previewUrl: perMap.profilePhoto?.url || null, verificationStatus: perMap.profilePhoto?.verificationStatus, reviewNotes: perMap.profilePhoto?.reviewNotes },
            licenseFront: { file: null, previewUrl: licMap.licenseFront?.url || null, verificationStatus: licMap.licenseFront?.verificationStatus, reviewNotes: licMap.licenseFront?.reviewNotes },
            licenseBack: { file: null, previewUrl: licMap.licenseBack?.url || null, verificationStatus: licMap.licenseBack?.verificationStatus, reviewNotes: licMap.licenseBack?.reviewNotes },
            vehiclePhoto: { file: null, previewUrl: vehMap.vehiclePhoto?.url || null, verificationStatus: vehMap.vehiclePhoto?.verificationStatus, reviewNotes: vehMap.vehiclePhoto?.reviewNotes },
            rcBook: { file: null, previewUrl: docMap.rcBook?.url || null, verificationStatus: docMap.rcBook?.verificationStatus, reviewNotes: docMap.rcBook?.reviewNotes },
            insurance: { file: null, previewUrl: docMap.insurance?.url || null, verificationStatus: docMap.insurance?.verificationStatus, reviewNotes: docMap.insurance?.reviewNotes },
            pollutionCertificate: { file: null, previewUrl: docMap.pollutionCertificate?.url || null, verificationStatus: docMap.pollutionCertificate?.verificationStatus, reviewNotes: docMap.pollutionCertificate?.reviewNotes },
            govtId: { file: null, previewUrl: docMap.govtId?.url || null, verificationStatus: docMap.govtId?.verificationStatus, reviewNotes: docMap.govtId?.reviewNotes },
            selfie: { file: null, previewUrl: docMap.selfie?.url || null, verificationStatus: docMap.selfie?.verificationStatus, reviewNotes: docMap.selfie?.reviewNotes },
          });
        } else {
          const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              if (parsed.personal) setPersonal(parsed.personal);
              if (parsed.license) setLicense(parsed.license);
              if (parsed.vehicle) setVehicle(parsed.vehicle);
              if (parsed.bank) setBank(parsed.bank);
            } catch (e) {
              console.error("Failed to parse draft", e);
            }
          }
        }
      } catch (err) {
        console.error("Error checking driver application", err);
      }
    };

    if (isAuthenticated) {
      checkExistingApplication();
    }
  }, [isAuthenticated]);

  // Save Draft to LocalStorage whenever form fields change
  useEffect(() => {
    if (status === "IDLE" || status === "DRAFT" || status === "REQUEST_CHANGES") {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ personal, license, vehicle, bank }));
    }
  }, [personal, license, vehicle, bank, status]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/jpg", "application/pdf"].includes(file.type)) {
      addNotification("error", "Invalid format. Only JPG, PNG, and PDF files are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      addNotification("error", "File size exceeds maximum limit of 5MB.");
      return;
    }

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFiles((prev) => ({ ...prev, [key]: { file, previewUrl: reader.result as string, verificationStatus: "PENDING" } }));
      };
      reader.readAsDataURL(file);
    } else {
      setFiles((prev) => ({ ...prev, [key]: { file, previewUrl: "PDF", verificationStatus: "PENDING" } }));
    }
  };

  const removeFile = (key: string) => {
    setFiles((prev) => ({ ...prev, [key]: { file: null, previewUrl: null } }));
  };

  // Step Validation Functions
  const validateStep1 = () => {
    if (!personal.fullName.trim() || !personal.phone.trim() || !personal.address.trim()) {
      addNotification("error", "Please fill in Full Name, Phone, and Address.");
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!license.licenseNumber.trim() || !license.expiryDate) {
      addNotification("error", "Please enter Licence Number and Expiry Date.");
      return false;
    }
    const exp = new Date(license.expiryDate);
    if (exp < new Date()) {
      addNotification("error", "Driving Licence has expired! Expired licences cannot be accepted.");
      return false;
    }
    if (!files.licenseFront.previewUrl) {
      addNotification("error", "Please upload the Front side of your Driving Licence.");
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!vehicle.vehicleType || !vehicle.number.trim()) {
      addNotification("error", "Please enter Vehicle Type and Registration Number.");
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!files.rcBook.previewUrl) {
      addNotification("error", "Please upload Vehicle RC Book.");
      return false;
    }
    return true;
  };

  const validateStep5 = () => {
    if (bank.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bank.ifsc.trim())) {
      addNotification("error", "Invalid IFSC format. Example: SBIN0001234");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (currentStep === 1 && !validateStep1()) return;
    if (currentStep === 2 && !validateStep2()) return;
    if (currentStep === 3 && !validateStep3()) return;
    if (currentStep === 4 && !validateStep4()) return;
    if (currentStep === 5 && !validateStep5()) return;
    setCurrentStep((prev) => Math.min(prev + 1, 6));
  };

  const handlePrev = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitApplication = async () => {
    setLoading(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((p) => (p >= 90 ? 90 : p + 15));
    }, 300);

    try {
      const formData = new FormData();
      formData.append("personalDetails", JSON.stringify(personal));
      formData.append("licenseDetails", JSON.stringify(license));
      formData.append("vehicleDetails", JSON.stringify(vehicle));
      formData.append("bankDetails", JSON.stringify(bank));

      if (status === "REQUEST_CHANGES" || status === "REJECTED") {
        formData.append("isResubmission", "true");
      }

      Object.keys(files).forEach((key) => {
        if (files[key].file) {
          formData.append(key, files[key].file as File);
        }
      });

      const res = await driverService.submitApplication(formData);
      clearInterval(progressInterval);
      setUploadProgress(100);
      setLoading(false);

      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setStatus("SUBMITTED");
      setApplicationData(res.application);
      addNotification("success", "Driver application submitted successfully!");
    } catch (error: unknown) {
      clearInterval(progressInterval);
      setLoading(false);
      setUploadProgress(0);
      const errObj = error as { response?: { data?: { message?: string } } };
      const msg = errObj.response?.data?.message || "Failed to submit application. Please try again.";
      addNotification("error", msg);
    }
  };

  if (["SUBMITTED", "PENDING", "APPROVED"].includes(status) && currentStep !== 6) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 sm:p-8 font-inter">
        <div className="max-w-xl w-full bg-surface rounded-3xl p-8 sm:p-10 text-center space-y-8 shadow-soft border border-border">
          {status === "APPROVED" ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-emerald-100 text-success rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={44} />
              </div>
              <div className="space-y-2">
                <span className="bg-emerald-100 text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider font-manrope">
                  Verified Driver Partner
                </span>
                <h2 className="text-3xl font-black text-primary tracking-tight font-manrope pt-2">Application Approved!</h2>
                <p className="text-text-secondary text-sm">Welcome to the Loopra Coimbatore Fleet. Your driver portal is now fully unlocked.</p>
              </div>
              <Button onClick={() => router.push("/driver")} className="w-full h-14 text-base font-bold rounded-2xl">
                Go to Driver Dashboard
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Clock size={44} />
              </div>
              <div className="space-y-2">
                <span className="bg-amber-100 text-amber-900 text-xs px-3.5 py-1.5 rounded-full font-black uppercase tracking-wider font-manrope">
                  Verification Pending
                </span>
                <h2 className="text-3xl font-black text-primary tracking-tight font-manrope pt-2">Application Under Review</h2>
                <p className="text-text-secondary text-sm max-w-md mx-auto">
                  Our RTO &amp; compliance team is currently verifying your submitted Driving Licence, Vehicle RC, and Identity records.
                </p>
              </div>

              <div className="bg-background p-6 rounded-2xl text-left space-y-4 border border-border">
                <h4 className="text-xs font-black uppercase tracking-widest text-text-secondary font-manrope">Verification Timeline</h4>
                <div className="space-y-3.5 text-xs font-bold text-text-primary">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                    <span>Personal Details &amp; Identity Submitted</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-success text-white rounded-full flex items-center justify-center text-[10px]">✓</div>
                    <span>Documents &amp; Vehicle Info Received</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] animate-pulse">⏳</div>
                    <span>Coimbatore RTO &amp; Background Verification</span>
                  </div>
                </div>
                <div className="pt-3 border-t border-border flex justify-between items-center text-xs">
                  <span className="text-text-secondary">Est. Review Time:</span>
                  <span className="font-bold text-primary font-manrope">24–48 Hours</span>
                </div>
              </div>

              <Button onClick={() => router.push("/dashboard")} variant="outline" className="w-full h-12 text-sm font-bold rounded-xl">
                Return to Rider Dashboard
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const steps = [
    { num: 1, title: "Personal", icon: User },
    { num: 2, title: "Licence", icon: FileText },
    { num: 3, title: "Vehicle", icon: Car },
    { num: 4, title: "Documents", icon: Upload },
    { num: 5, title: "Bank Details", icon: CreditCard },
    { num: 6, title: "Review", icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between font-inter pb-12">
      <header className="bg-primary text-white py-6 px-4 sm:px-8 shadow-md">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center font-black text-xl text-white font-manrope">
              L
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight font-manrope">Loopra Driver Onboarding</h1>
              <p className="text-xs text-slate-300">Coimbatore Fleet Partnership Program</p>
            </div>
          </div>
          <button onClick={() => router.push("/dashboard")} className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition-colors">
            Exit to Dashboard
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-8 py-8 space-y-8">
        {status === "REQUEST_CHANGES" && (
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-base font-manrope">
              <AlertCircle className="text-amber-600 shrink-0" /> Action Required on Your Application
            </div>
            <p className="text-xs leading-relaxed font-medium">
              Admin Review Feedback: <strong>{applicationData?.reviewComments || "Please update flagged documents or details."}</strong>
            </p>
          </div>
        )}

        <div className="bg-surface p-4 sm:p-6 rounded-3xl border border-border shadow-soft">
          <div className="flex items-center justify-between">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isDone = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <React.Fragment key={s.num}>
                  <div 
                    onClick={() => { if (s.num < currentStep) setCurrentStep(s.num); }}
                    className={`flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
                      isCurrent ? "text-primary scale-105" : isDone ? "text-success" : "text-text-secondary opacity-60"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${
                      isCurrent ? "bg-primary text-white shadow-md font-manrope" : isDone ? "bg-emerald-100 text-success" : "bg-background border border-border"
                    }`}>
                      {isDone ? "✓" : <Icon size={18} />}
                    </div>
                    <span className="text-[11px] font-bold hidden sm:block font-manrope">{s.title}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${currentStep > s.num ? "bg-success" : "bg-slate-200"}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        <div className="bg-surface p-6 sm:p-10 rounded-3xl border border-border shadow-soft relative overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-2xl font-black text-primary font-manrope">Step 1: Personal Information</h2>
                    <p className="text-xs text-text-secondary mt-1">Provide your legal personal and contact details as registered in your government IDs.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input label="Full Name" value={personal.fullName} onChange={(e) => setPersonal({ ...personal, fullName: e.target.value })} required />
                    <Input label="Phone Number" value={personal.phone} onChange={(e) => setPersonal({ ...personal, phone: e.target.value })} placeholder="+91 9876543210" required />
                    <Input label="Email Address" value={personal.email} onChange={(e) => setPersonal({ ...personal, email: e.target.value })} disabled />
                    <Input label="Date of Birth" type="date" value={personal.dob} onChange={(e) => setPersonal({ ...personal, dob: e.target.value })} />
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary">Gender</label>
                      <select value={personal.gender} onChange={(e) => setPersonal({ ...personal, gender: e.target.value })} className="w-full h-12 px-4 border border-border rounded-xl bg-surface text-sm font-semibold outline-none focus:border-accent">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <Input label="Emergency Contact Number" value={personal.emergencyContact} onChange={(e) => setPersonal({ ...personal, emergencyContact: e.target.value })} placeholder="+91 9876543210" />
                    <div className="sm:col-span-2">
                      <Input label="Residential Address" value={personal.address} onChange={(e) => setPersonal({ ...personal, address: e.target.value })} placeholder="Door No, Street, Landmark" required />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-2xl font-black text-primary font-manrope">Step 2: Driving Licence Verification</h2>
                    <p className="text-xs text-text-secondary mt-1">Enter your valid Indian commercial or private driving licence details.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input label="Licence Number" value={license.licenseNumber} onChange={(e) => setLicense({ ...license, licenseNumber: e.target.value.toUpperCase() })} placeholder="TN37 20220012345" required />
                    <Input label="Licence Expiry Date" type="date" value={license.expiryDate} onChange={(e) => setLicense({ ...license, expiryDate: e.target.value })} required />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-primary flex justify-between">
                        <span>Licence Front Side *</span>
                        {files.licenseFront.verificationStatus && (
                          <span className={`text-[10px] font-black uppercase ${files.licenseFront.verificationStatus === "APPROVED" ? "text-success" : files.licenseFront.verificationStatus === "RE_UPLOAD_REQUIRED" ? "text-danger" : "text-amber-600"}`}>
                            {files.licenseFront.verificationStatus}
                          </span>
                        )}
                      </label>
                      {files.licenseFront.reviewNotes && (
                        <p className="text-[11px] text-danger bg-red-50 p-2 rounded-lg font-medium">{files.licenseFront.reviewNotes}</p>
                      )}
                      <div className="relative border-2 border-dashed border-border rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                        <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(e, "licenseFront")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {files.licenseFront.previewUrl ? (
                          <div className="space-y-2">
                            {files.licenseFront.previewUrl === "PDF" ? <FileText size={36} className="mx-auto text-primary" /> : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={files.licenseFront.previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                            )}
                            <button type="button" onClick={() => removeFile("licenseFront")} className="text-xs font-bold text-danger hover:underline inline-flex items-center gap-1"><Trash2 size={12} /> Remove / Replace</button>
                          </div>
                        ) : (
                          <div className="py-4 text-text-secondary space-y-1">
                            <Upload size={28} className="mx-auto text-primary" />
                            <p className="text-xs font-bold text-text-primary">Click or drag Front photo</p>
                            <p className="text-[10px]">JPG, PNG or PDF (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-primary">Licence Back Side (Optional)</label>
                      <div className="relative border-2 border-dashed border-border rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                        <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(e, "licenseBack")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        {files.licenseBack.previewUrl ? (
                          <div className="space-y-2">
                            {files.licenseBack.previewUrl === "PDF" ? <FileText size={36} className="mx-auto text-primary" /> : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={files.licenseBack.previewUrl} alt="Preview" className="max-h-32 mx-auto rounded-lg object-contain" />
                            )}
                            <button type="button" onClick={() => removeFile("licenseBack")} className="text-xs font-bold text-danger hover:underline inline-flex items-center gap-1"><Trash2 size={12} /> Remove / Replace</button>
                          </div>
                        ) : (
                          <div className="py-4 text-text-secondary space-y-1">
                            <Upload size={28} className="mx-auto text-primary" />
                            <p className="text-xs font-bold text-text-primary">Click or drag Back photo</p>
                            <p className="text-[10px]">JPG, PNG or PDF (Max 5MB)</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-2xl font-black text-primary font-manrope">Step 3: Vehicle Information</h2>
                    <p className="text-xs text-text-secondary mt-1">Specify the vehicle you will operate on the Loopra platform.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-text-secondary">Vehicle Category *</label>
                      <select value={vehicle.vehicleType} onChange={(e) => setVehicle({ ...vehicle, vehicleType: e.target.value })} className="w-full h-12 px-4 border border-border rounded-xl bg-surface text-sm font-semibold outline-none focus:border-accent">
                        <option value="car">Sedan / Hatchback (Car)</option>
                        <option value="suv">SUV / Premium</option>
                        <option value="auto">Auto Rickshaw</option>
                        <option value="bike">Bike / Two-Wheeler</option>
                      </select>
                    </div>
                    <Input label="Vehicle Registration Number *" value={vehicle.number} onChange={(e) => setVehicle({ ...vehicle, number: e.target.value.toUpperCase() })} placeholder="TN 37 AB 1234" required />
                    <Input label="Brand / Make" value={vehicle.brand} onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} placeholder="Maruti Suzuki / Hyundai" />
                    <Input label="Model Name" value={vehicle.model} onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} placeholder="Dzire / Swift" />
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-2xl font-black text-primary font-manrope">Step 4: Vehicle &amp; Identity Documents</h2>
                    <p className="text-xs text-text-secondary mt-1">Upload clear photos or PDFs of your registration and insurance papers.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {[
                      { key: "rcBook", label: "Vehicle RC Book *", req: true },
                      { key: "insurance", label: "Vehicle Insurance Certificate", req: false },
                      { key: "pollutionCertificate", label: "Pollution Certificate (PUC)", req: false },
                      { key: "govtId", label: "Government ID (Aadhaar/Voter)", req: false },
                    ].map((doc) => (
                      <div key={doc.key} className="space-y-2">
                        <label className="text-xs font-bold text-text-primary flex justify-between">
                          <span>{doc.label}</span>
                          {files[doc.key]?.verificationStatus && (
                            <span className={`text-[10px] font-black uppercase ${files[doc.key].verificationStatus === "APPROVED" ? "text-success" : files[doc.key].verificationStatus === "RE_UPLOAD_REQUIRED" ? "text-danger" : "text-amber-600"}`}>
                              {files[doc.key].verificationStatus}
                            </span>
                          )}
                        </label>
                        {files[doc.key]?.reviewNotes && (
                          <p className="text-[11px] text-danger bg-red-50 p-2 rounded-lg font-medium">{files[doc.key].reviewNotes}</p>
                        )}
                        <div className="relative border-2 border-dashed border-border rounded-2xl p-4 text-center hover:bg-slate-50 transition-colors">
                          <input type="file" accept="image/jpeg,image/png,application/pdf" onChange={(e) => handleFileChange(e, doc.key)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          {files[doc.key]?.previewUrl ? (
                            <div className="space-y-2">
                              {files[doc.key].previewUrl === "PDF" ? <FileText size={32} className="mx-auto text-primary" /> : (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={files[doc.key].previewUrl!} alt="Preview" className="max-h-28 mx-auto rounded-lg object-contain" />
                              )}
                              <button type="button" onClick={() => removeFile(doc.key)} className="text-xs font-bold text-danger hover:underline inline-flex items-center gap-1"><Trash2 size={12} /> Replace</button>
                            </div>
                          ) : (
                            <div className="py-3 text-text-secondary space-y-1">
                              <Upload size={24} className="mx-auto text-primary" />
                              <p className="text-xs font-bold text-text-primary">Upload Document</p>
                              <p className="text-[10px]">JPG, PNG or PDF (Max 5MB)</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 5 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-2xl font-black text-primary font-manrope">Step 5: Payout &amp; Bank Details</h2>
                    <p className="text-xs text-text-secondary mt-1">Direct bank transfer details for weekly ride payout dispatches.</p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <Input label="Account Holder Name" value={bank.accountHolder} onChange={(e) => setBank({ ...bank, accountHolder: e.target.value })} placeholder="As per bank passbook" />
                    <Input label="Account Number" value={bank.accountNumber} onChange={(e) => setBank({ ...bank, accountNumber: e.target.value })} placeholder="9182391203912" />
                    <Input label="IFSC Code" value={bank.ifsc} onChange={(e) => setBank({ ...bank, ifsc: e.target.value.toUpperCase() })} placeholder="SBIN0001234" />
                    <Input label="Bank Name &amp; Branch" value={bank.bankName} onChange={(e) => setBank({ ...bank, bankName: e.target.value })} placeholder="SBI Coimbatore Main" />
                    <div className="sm:col-span-2">
                      <Input label="UPI ID (For instant payouts)" value={bank.upiId} onChange={(e) => setBank({ ...bank, upiId: e.target.value.toLowerCase() })} placeholder="driver@upi" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 6 && (
                <div className="space-y-6">
                  <div className="border-b border-border pb-4">
                    <h2 className="text-2xl font-black text-primary font-manrope">Step 6: Final Review &amp; Submission</h2>
                    <p className="text-xs text-text-secondary mt-1">Review your entered details and uploaded document previews before submitting.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    <div className="p-4 bg-background rounded-2xl border border-border space-y-2">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <h4 className="font-bold text-text-primary uppercase tracking-wider font-manrope">Personal Details</h4>
                        <button type="button" onClick={() => setCurrentStep(1)} className="text-accent font-bold hover:underline">Edit</button>
                      </div>
                      <p><strong>Name:</strong> {personal.fullName}</p>
                      <p><strong>Phone:</strong> {personal.phone}</p>
                      <p><strong>Address:</strong> {personal.address}, {personal.city}</p>
                    </div>

                    <div className="p-4 bg-background rounded-2xl border border-border space-y-2">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <h4 className="font-bold text-text-primary uppercase tracking-wider font-manrope">Licence &amp; Vehicle</h4>
                        <button type="button" onClick={() => setCurrentStep(2)} className="text-accent font-bold hover:underline">Edit</button>
                      </div>
                      <p><strong>Licence No:</strong> {license.licenseNumber}</p>
                      <p><strong>Expiry:</strong> {license.expiryDate}</p>
                      <p><strong>Vehicle:</strong> {vehicle.vehicleType.toUpperCase()} ({vehicle.number})</p>
                    </div>
                  </div>

                  <div className="p-4 bg-background rounded-2xl border border-border space-y-3">
                    <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider font-manrope border-b border-border pb-2">Uploaded Documents Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {Object.keys(files).map((key) => {
                        const doc = files[key];
                        if (!doc.previewUrl) return null;
                        return (
                          <div key={key} className="p-2 bg-surface rounded-xl border border-border text-center space-y-1">
                            <span className="text-[10px] font-bold text-text-secondary block truncate capitalize">{key}</span>
                            {doc.previewUrl === "PDF" ? <FileText size={24} className="mx-auto text-primary" /> : (
                              /* eslint-disable-next-line @next/next/no-img-element */
                              <img src={doc.previewUrl} alt={key} className="h-16 mx-auto object-contain rounded" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {loading && (
                    <div className="space-y-2 pt-2">
                      <div className="flex justify-between text-xs font-bold text-primary font-manrope">
                        <span>Uploading metadata and securing documents...</span>
                        <span>{uploadProgress}%</span>
                      </div>
                      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full bg-accent transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-border">
                {currentStep > 1 ? (
                  <Button type="button" variant="outline" onClick={handlePrev} disabled={loading} className="h-12 px-6 font-bold rounded-xl">
                    <ArrowLeft size={16} className="mr-2" /> Back
                  </Button>
                ) : <div />}

                {currentStep < 6 ? (
                  <Button type="button" variant="primary" onClick={handleNext} className="h-12 px-8 font-bold rounded-xl">
                    Next Step <ArrowRight size={16} className="ml-2" />
                  </Button>
                ) : (
                  <Button type="button" variant="primary" onClick={handleSubmitApplication} loading={loading} disabled={loading} className="h-14 px-10 font-bold text-base rounded-2xl shadow-md">
                    Submit Application
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

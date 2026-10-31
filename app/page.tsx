'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCw, 
  Plus, 
  Phone, 
  LogOut, 
  Store, 
  CheckCircle2, 
  Copy, 
  Check, 
  Eye, 
  Upload, 
  Wallet, 
  Building2,
  TrendingUp,
  TrendingDown,
  Camera,
  RefreshCw,
  X,
  Trash2,
  Send,
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
  Sun,
  Moon,
  AlertCircle
} from 'lucide-react';
import { MfsLogo } from '@/components/MfsLogos';

type MfsProvider = 'bkash' | 'nagad' | 'rocket' | 'upay';
type TransactionDirection = 'give' | 'take';
type TransactionStatus = 'pending' | 'sent' | 'received' | 'rejected';

interface Transaction {
  id: number;
  sender_phone: string;
  receiver_phone: string;
  mfs_type: MfsProvider;
  customer_phone: string | null;
  amount: string | number;
  direction: TransactionDirection;
  trx_id: string | null;
  screenshot_url: string | null;
  status: TransactionStatus;
  notes: string | null;
  created_at: string;
  updated_at?: string;
}

interface SummaryData {
  todayGiven: number;
  todayTaken: number;
  totalGiven: number;
  totalTaken: number;
  partnerGiven: number;
  partnerTaken: number;
  netBalance: number;
  statusText: string;
}

const PRESET_SHOPS = [
  { name: 'Rufaidah Digital Point', shortName: 'Rufaidah', phone: '01814558055' },
  { name: 'Mottaleb Telecom', shortName: 'Mottaleb', phone: '01832323030' },
];

const ALLOWED_PHONES = ['01814558055', '01832323030'];
const RESET_ALLOWED_PHONE = '01814558055';
const RESET_SECURITY_CODE = '28562';

const MFS_CONFIG = {
  bkash: { name: 'bKash', color: 'bg-[#C5A880]', text: 'text-[#C5A880]', border: 'border-[#C5A880]/30', bgLight: 'bg-[#C5A880]/10' },
  nagad: { name: 'Nagad', color: 'bg-orange-600', text: 'text-orange-400', border: 'border-orange-500/30', bgLight: 'bg-orange-500/10' },
  rocket: { name: 'Rocket', color: 'bg-purple-600', text: 'text-purple-400', border: 'border-purple-500/30', bgLight: 'bg-purple-500/10' },
  upay: { name: 'Upay', color: 'bg-blue-700', text: 'text-blue-400', border: 'border-blue-500/30', bgLight: 'bg-blue-500/10' },
};

export default function Home() {
  // Authentication state
  const [userPhone, setUserPhone] = useState<string>('');
  const [partnerPhone, setPartnerPhone] = useState<string>('');
  const [phoneInput, setPhoneInput] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // Transactions & Summary
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedTxId, setExpandedTxId] = useState<number | string | null>(null);

  // Filters
  const [dateRange, setDateRange] = useState<'today' | 'all'>('today');
  const [selectedMfs, setSelectedMfs] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState<boolean>(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Fulfill Request Modal (Shop B claims request, copies phone, pays, submits TrxID)
  const [fulfillTx, setFulfillTx] = useState<Transaction | null>(null);
  const [fulfillTrxId, setFulfillTrxId] = useState<string>('');
  const [fulfillScreenshot, setFulfillScreenshot] = useState<string>('');
  const [fulfillNotes, setFulfillNotes] = useState<string>('');
  const [fulfillSubmitting, setFulfillSubmitting] = useState<boolean>(false);

  // Reset Modal State (Rufaidah: 01814558055 only)
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [resetSecurityCode, setResetSecurityCode] = useState<string>('');
  const [resetSubmitting, setResetSubmitting] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string>('');

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraTarget, setCameraTarget] = useState<'create' | 'fulfill'>('create');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const nativeCameraInputRef = useRef<HTMLInputElement | null>(null);

  // New Transaction Form
  const [formData, setFormData] = useState({
    mfs_type: 'bkash' as MfsProvider,
    customer_phone: '',
    amount: '',
    direction: 'give' as TransactionDirection,
    trx_id: '',
    notes: '',
    screenshot_url: '',
    status: 'sent' as TransactionStatus,
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);

  // Production Non-blocking Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Theme state: 'dark' (Charcoal & Rose Gold) or 'light' (Crisp Slate & Pure White)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('mfs_theme') as 'dark' | 'light' | null;
    const initial = saved || 'dark';
    setTheme(initial);
    if (initial === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('mfs_theme', next);
    if (next === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Load auth from localStorage on mount (Do not auto-login if logged out)
  useEffect(() => {
    const savedUser = localStorage.getItem('mfs_user_phone');

    if (savedUser && ALLOWED_PHONES.includes(savedUser)) {
      setUserPhone(savedUser);
      setPartnerPhone(savedUser === PRESET_SHOPS[0].phone ? PRESET_SHOPS[1].phone : PRESET_SHOPS[0].phone);
    } else {
      setUserPhone('');
      setPartnerPhone('');
    }
  }, []);

  // Fetch data
  const fetchData = useCallback(async (isManualRefresh = false) => {
    if (!userPhone) return;
    setIsLoading(true);
    try {
      const txParams = new URLSearchParams({
        userPhone,
        ...(partnerPhone ? { partnerPhone } : {}),
        dateRange,
        mfs: selectedMfs,
        status: selectedStatus,
      });

      // Single combined fast query returns both transactions and summary
      const txRes = await fetch(`/api/transactions?${txParams.toString()}`);

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
        if (txData.summary) {
          setSummary(txData.summary);
        }
        if (isManualRefresh) {
          showToast('Ledger refreshed!', 'info');
        }
      } else {
        if (isManualRefresh) {
          showToast('Failed to refresh data', 'error');
        }
      }
    } catch (err) {
      console.error('Fetch error:', err);
      if (isManualRefresh) {
        showToast('Network error, please check connection', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  }, [userPhone, partnerPhone, dateRange, selectedMfs, selectedStatus]);

  const handleRefresh = async () => {
    if (isLoading) return;
    await fetchData(true);
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Clean up camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Camera Management
  const triggerCamera = (target: 'create' | 'fulfill' = 'create') => {
    setCameraTarget(target);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      nativeCameraInputRef.current?.click();
      return;
    }
    startCamera(cameraFacing, target);
  };

  const startCamera = async (facing: 'environment' | 'user' = 'environment', target: 'create' | 'fulfill' = 'create') => {
    stopCamera();
    setCameraTarget(target);
    setIsCameraActive(true);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error('No getUserMedia support');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err: any) {
      console.warn('getUserMedia error, opening native camera picker:', err);
      stopCamera();
      nativeCameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      if (cameraTarget === 'fulfill') {
        setFulfillScreenshot(dataUrl);
      } else {
        setFormData((prev) => ({ ...prev, screenshot_url: dataUrl }));
      }
      stopCamera();
    }
  };

  const toggleCameraFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    startCamera(nextFacing, cameraTarget);
  };

  // Handle Login (Strictly 01814558055 or 01832323030)
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUser = phoneInput.trim();
    if (!cleanUser) {
      setLoginError('Please enter your shop phone number.');
      return;
    }

    if (!ALLOWED_PHONES.includes(cleanUser)) {
      setLoginError('Unauthorized number! This shop number is not registered.');
      return;
    }

    const cleanPartner = cleanUser === PRESET_SHOPS[0].phone ? PRESET_SHOPS[1].phone : PRESET_SHOPS[0].phone;
    
    setUserPhone(cleanUser);
    setPartnerPhone(cleanPartner);
    localStorage.setItem('mfs_user_phone', cleanUser);
    localStorage.setItem('mfs_partner_phone', cleanPartner);
    setPhoneInput('');
    setLoginError('');
  };

  const handleLogout = () => {
    localStorage.removeItem('mfs_user_phone');
    localStorage.removeItem('mfs_partner_phone');
    setUserPhone('');
    setPartnerPhone('');
    setPhoneInput('');
    setLoginError('');
  };

  // Reset Ledger (Only 01814558055 with code 28562)
  const handleResetLedger = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userPhone !== RESET_ALLOWED_PHONE) {
      alert('Permission denied. Only Rufaidah Digital Point can reset the ledger.');
      return;
    }

    if (resetSecurityCode.trim() !== RESET_SECURITY_CODE) {
      setResetError('Invalid security code. Please enter the correct code.');
      return;
    }

    setResetSubmitting(true);
    setResetError('');
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPhone,
          securityCode: resetSecurityCode.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        showToast('All ledger transactions have been reset successfully!', 'success');
        setIsResetModalOpen(false);
        setResetSecurityCode('');
        fetchData();
      } else {
        setResetError(data.error || 'Failed to reset ledger');
      }
    } catch (err: any) {
      setResetError(err.message || 'Network error resetting ledger');
    } finally {
      setResetSubmitting(false);
    }
  };


  // Image file to base64
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 6 * 1024 * 1024) {
      showToast('File size exceeds 6MB limit. Please upload a smaller photo.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      if (cameraTarget === 'fulfill') {
        setFulfillScreenshot(dataUrl);
      } else {
        setFormData((prev) => ({ ...prev, screenshot_url: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Create Transaction with Instant Optimistic UI
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.amount) {
      showToast('Please enter an amount.', 'error');
      return;
    }

    if (!userPhone || !partnerPhone) {
      showToast('Shop phone is missing. Please select your shop first.', 'error');
      return;
    }

    const isGive = formData.direction === 'give';
    const numAmount = parseFloat(formData.amount);
    const cleanCustomerPhone = formData.customer_phone.trim() || null;
    const cleanTrxId = isGive ? (formData.trx_id ? formData.trx_id.trim() : null) : null;
    const cleanNotes = formData.notes ? formData.notes.trim() : null;
    const cleanScreenshot = isGive ? (formData.screenshot_url || null) : null;

    const payload = {
      sender_phone: userPhone,
      receiver_phone: partnerPhone,
      mfs_type: formData.mfs_type,
      customer_phone: cleanCustomerPhone,
      amount: numAmount,
      direction: formData.direction,
      trx_id: cleanTrxId,
      screenshot_url: cleanScreenshot,
      status: isGive ? 'sent' : 'pending',
      notes: cleanNotes,
    };

    // Instant UI reaction: close modal, stop camera, and show toast in 0ms!
    setIsCreateModalOpen(false);
    stopCamera();
    showToast('Transaction saved successfully!', 'success');

    // Instant optimistic addition to local feed
    const tempId = Date.now();
    const optimisticTx: Transaction = {
      id: tempId,
      sender_phone: userPhone,
      receiver_phone: partnerPhone,
      mfs_type: formData.mfs_type,
      customer_phone: cleanCustomerPhone,
      amount: numAmount,
      direction: formData.direction,
      trx_id: cleanTrxId,
      screenshot_url: cleanScreenshot,
      status: (isGive ? 'sent' : 'pending') as TransactionStatus,
      notes: cleanNotes,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTransactions((prev) => [optimisticTx, ...prev]);

    // Reset form immediately
    setFormData({
      mfs_type: 'bkash',
      customer_phone: '',
      amount: '',
      direction: 'give',
      trx_id: '',
      notes: '',
      screenshot_url: '',
      status: 'sent',
    });

    setFormSubmitting(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        // Re-sync with actual server record
        fetchData();
      } else {
        // Rollback optimistic item if failed
        setTransactions((prev) => prev.filter((t) => t.id !== tempId));
        showToast(data.error || 'Failed to create transaction', 'error');
      }
    } catch (err: any) {
      console.error('Submit error:', err);
      setTransactions((prev) => prev.filter((t) => t.id !== tempId));
      showToast('Error submitting transaction: ' + (err.message || 'Please check connection'), 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Fulfill Request Submission with Instant Optimistic UI (Shop B sends money & submits TrxID)
  const handleFulfillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fulfillTx) return;
    if (!fulfillTrxId.trim()) {
      showToast('Please enter the Transaction ID (TrxID) after completing payment.', 'error');
      return;
    }

    const currentFulfill = fulfillTx;
    const submittedTrxId = fulfillTrxId.trim().toUpperCase();
    const submittedNotes = fulfillNotes.trim();
    const submittedScreenshot = fulfillScreenshot;

    // Instant UI feedback: close modal and show toast in 0ms!
    setFulfillTx(null);
    stopCamera();
    showToast('Payment submitted and verified successfully!', 'success');

    // Instant local state update in 0ms!
    const prevTransactions = [...transactions];
    const prevSummary = summary ? { ...summary } : null;

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === currentFulfill.id
          ? {
              ...t,
              status: 'received' as TransactionStatus,
              trx_id: submittedTrxId,
              screenshot_url: submittedScreenshot || t.screenshot_url,
              notes: submittedNotes ? (t.notes ? `${t.notes} | ${submittedNotes}` : submittedNotes) : t.notes,
            }
          : t
      )
    );

    // Optimistically update summary in 0ms
    if (summary) {
      const amt = Number(currentFulfill.amount) || 0;
      const isSender = currentFulfill.sender_phone === userPhone;
      const isPayer = (currentFulfill.direction === 'give' && isSender) || (currentFulfill.direction === 'take' && !isSender);
      setSummary((prev) => {
        if (!prev) return null;
        const newGiven = isPayer ? prev.totalGiven + amt : prev.totalGiven;
        const newTaken = !isPayer ? prev.totalTaken + amt : prev.totalTaken;
        const newNet = newGiven - newTaken;
        return {
          ...prev,
          todayGiven: isPayer ? prev.todayGiven + amt : prev.todayGiven,
          todayTaken: !isPayer ? prev.todayTaken + amt : prev.todayTaken,
          totalGiven: newGiven,
          totalTaken: newTaken,
          netBalance: newNet,
          statusText: newNet > 0 
            ? `Partner owes you ৳ ${newNet.toLocaleString()}`
            : newNet < 0 
            ? `You owe partner ৳ ${Math.abs(newNet).toLocaleString()}`
            : 'All settled up (৳ 0)',
        };
      });
    }

    setFulfillSubmitting(true);
    try {
      const res = await fetch(`/api/transactions/${currentFulfill.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'received',
          trx_id: submittedTrxId,
          screenshot_url: submittedScreenshot || null,
          notes: submittedNotes 
            ? (currentFulfill.notes ? `${currentFulfill.notes} | ${submittedNotes}` : submittedNotes) 
            : currentFulfill.notes,
        }),
      });

      if (!res.ok) {
        setTransactions(prevTransactions);
        setSummary(prevSummary);
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Failed to complete transaction', 'error');
      } else {
        fetchData();
      }
    } catch (err: any) {
      console.error(err);
      setTransactions(prevTransactions);
      setSummary(prevSummary);
      showToast('Error completing transaction: ' + (err.message || 'Network issue'), 'error');
    } finally {
      setFulfillSubmitting(false);
    }
  };

  // Instant Optimistic Status Update (Confirm Received, Reject, Re-open)
  const handleUpdateStatus = async (id: number, newStatus: TransactionStatus) => {
    const prevTransactions = [...transactions];
    const prevSummary = summary ? { ...summary } : null;
    const targetTx = transactions.find((t) => t.id === id);

    // Instant UI change in 0 milliseconds!
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    // If marked received, immediately update summary balance in 0ms!
    if (summary && targetTx && newStatus === 'received' && targetTx.status !== 'received') {
      const amt = Number(targetTx.amount) || 0;
      const isSender = targetTx.sender_phone === userPhone;
      const isPayer = (targetTx.direction === 'give' && isSender) || (targetTx.direction === 'take' && !isSender);
      setSummary((prev) => {
        if (!prev) return null;
        const newGiven = isPayer ? prev.totalGiven + amt : prev.totalGiven;
        const newTaken = !isPayer ? prev.totalTaken + amt : prev.totalTaken;
        const newNet = newGiven - newTaken;
        return {
          ...prev,
          todayGiven: isPayer ? prev.todayGiven + amt : prev.todayGiven,
          todayTaken: !isPayer ? prev.todayTaken + amt : prev.todayTaken,
          totalGiven: newGiven,
          totalTaken: newTaken,
          netBalance: newNet,
          statusText: newNet > 0 
            ? `Partner owes you ৳ ${newNet.toLocaleString()}`
            : newNet < 0 
            ? `You owe partner ৳ ${Math.abs(newNet).toLocaleString()}`
            : 'All settled up (৳ 0)',
        };
      });
    }

    showToast(`Transaction marked as ${newStatus}`, 'info');

    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        // Rollback if server fails
        setTransactions(prevTransactions);
        setSummary(prevSummary);
        showToast('Server error, reverting status', 'error');
      } else {
        // Background silent sync
        fetchData();
      }
    } catch (err) {
      console.error(err);
      setTransactions(prevTransactions);
      setSummary(prevSummary);
      showToast('Network error, please check connection', 'error');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Helper for responsive balance badge (desktop header & mobile banner)
  const renderBalanceBadge = (isMobile = false) => {
    if (!summary) return null;
    if (summary.netBalance > 0) {
      return (
        <div className={`flex items-center justify-between sm:justify-start gap-2 rounded-sm bg-[#C5A880]/15 dark:bg-[#C5A880]/10 border border-[#C5A880]/40 dark:border-[#C5A880]/30 shadow-xs ${isMobile ? 'h-8 px-2.5 w-full' : 'h-9 px-3'}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-none bg-[#C5A880]/20 flex items-center justify-center text-[#9E7B4F] dark:text-[#C5A880] shrink-0">
              <TrendingUp className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <span className="text-[10px] font-semibold text-[#9E7B4F] dark:text-[#C5A880] uppercase tracking-wider">Receivable:</span>
          </div>
          <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-amber-100">+ ৳ {summary.netBalance.toLocaleString()}</span>
        </div>
      );
    }
    if (summary.netBalance < 0) {
      return (
        <div className={`flex items-center justify-between sm:justify-start gap-2 rounded-sm bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 shadow-xs ${isMobile ? 'h-8 px-2.5 w-full' : 'h-9 px-3'}`}>
          <div className="flex items-center gap-1.5 leading-none">
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-none bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600 dark:text-rose-300 shrink-0">
              <TrendingDown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            </div>
            <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-300 uppercase tracking-wider">Payable:</span>
          </div>
          <span className="font-mono font-bold text-xs sm:text-sm text-rose-600 dark:text-rose-100">- ৳ {Math.abs(summary.netBalance).toLocaleString()}</span>
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-between sm:justify-start gap-2 rounded-sm bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 shadow-xs ${isMobile ? 'h-8 px-2.5 w-full' : 'h-9 px-3'}`}>
        <div className="flex items-center gap-1.5 leading-none">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-none bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shrink-0">
            <CheckCircle2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          </div>
          <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Settled:</span>
        </div>
        <span className="font-mono font-bold text-xs sm:text-sm text-slate-800 dark:text-slate-200">৳ 0</span>
      </div>
    );
  };

  // Dedicated Polished Fintech Login View when not logged in
  if (!userPhone) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-[#0E0F14] flex items-center justify-center p-4 relative overflow-hidden font-sans text-slate-800 dark:text-slate-100 transition-colors">
        {/* Subtle decorative glowing background shapes in Rose Gold & Dark Slate */}
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-[#C5A880]/10 dark:bg-[#C5A880]/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-slate-300/40 dark:bg-slate-800/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Theme Toggle Button in Login Screen (top-right corner) */}
        <div className="absolute top-4 right-4 z-20">
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? "Switch to White Mode" : "Switch to Dark Mode"}
            className="w-9 h-9 rounded-sm flex items-center justify-center shadow-xs transition active:scale-95 cursor-pointer bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-700 dark:text-[#C5A880] hover:text-[#B3966F]"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#C5A880]" />
            ) : (
              <Moon className="w-4 h-4 text-slate-700" />
            )}
          </button>
        </div>

        <div className="max-w-md w-full bg-white dark:bg-[#12131A] rounded-sm shadow-xl dark:shadow-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-9 relative z-10 transition-colors">
          {/* Official Brand Logos Strip */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {(['bkash', 'nagad', 'rocket', 'upay'] as MfsProvider[]).map((p) => (
              <div
                key={p}
                className="w-10 h-7 flex items-center justify-center p-1 bg-white border border-slate-200 dark:border-slate-700/60 rounded-xs shadow-xs"
              >
                <MfsLogo type={p} className="w-full h-full object-contain" />
              </div>
            ))}
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 bg-[#C5A880]/15 text-[#9E7B4F] dark:text-[#C5A880] rounded-sm mb-3 border border-[#C5A880]/30 shadow-xs">
              <Store className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-medium text-slate-900 dark:text-slate-100 tracking-tight">Dual-Shop MFS Ledger</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Enter your authorized shop phone number to access the mutual ledger.
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1.5">
                Authorized Shop Phone Number
              </label>
              <div className="relative flex items-center">
                <div className="absolute left-3 flex items-center gap-1.5 text-slate-400 pointer-events-none">
                  <Phone className="w-4 h-4 text-[#9E7B4F] dark:text-[#C5A880]" />
                  <span className="text-xs font-mono font-semibold text-slate-400 dark:text-slate-500 border-r border-slate-200 dark:border-slate-800 pr-2">+88</span>
                </div>
                <input
                  type="tel"
                  required
                  autoFocus
                  maxLength={11}
                  placeholder="01XXXXXXXXX"
                  value={phoneInput}
                  onChange={(e) => {
                    setPhoneInput(e.target.value);
                    setLoginError('');
                  }}
                  className="w-full text-sm font-mono font-bold tracking-wider pl-20 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none transition"
                />
              </div>
              {loginError && (
                <div className="mt-2 p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 rounded-sm flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-300 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
                  <span>{loginError}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 text-xs font-semibold bg-[#C5A880] hover:bg-[#B3966F] text-slate-950 rounded-sm shadow-sm transition flex items-center justify-center gap-2 tracking-wide uppercase cursor-pointer active:scale-[0.98]"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Enter Ledger</span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </button>
          </form>

          {/* Secure Privacy Notice */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-[#9E7B4F] dark:text-[#C5A880] shrink-0" />
            <span>Securely encrypted for authorized dual-shop accounting</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0E0F14] pb-16 font-sans antialiased text-slate-800 dark:text-slate-100 transition-colors">
      {/* Hidden Native Camera Input */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Hidden File Picker */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
      />

      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#12131A]/95 backdrop-blur-md shadow-xs dark:shadow-md transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-0 sm:h-14 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
          {/* Top Row: Shop Info & Mobile Action Buttons */}
          <div className="flex items-center justify-between w-full sm:w-auto gap-2">
            {/* Left: Theme Switcher + Shop Profile */}
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <button
                type="button"
                onClick={toggleTheme}
                title={theme === 'dark' ? "Switch to White / Light Mode" : "Switch to Dark Mode"}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-[#191A22] dark:hover:bg-slate-800/80 border border-slate-300 dark:border-slate-800 flex items-center justify-center shadow-xs shrink-0 transition active:scale-95 cursor-pointer"
              >
                {theme === 'dark' ? (
                  <Sun className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#C5A880] hover:rotate-45 transition-transform" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-slate-700" />
                )}
              </button>
              <div className="text-left min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#C5A880] animate-pulse shrink-0"></span>
                  <h1 className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm leading-tight truncate max-w-[140px] xs:max-w-[200px] sm:max-w-none">
                    {userPhone === PRESET_SHOPS[0].phone ? 'Rufaidah Digital Point' : 'Mottaleb Telecom'}
                  </h1>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 pl-3.5 font-medium leading-none mt-0.5 truncate max-w-[150px] sm:max-w-none">
                  Partner: <span className="text-slate-700 dark:text-slate-300 font-semibold">{partnerPhone === PRESET_SHOPS[0].phone ? 'Rufaidah Digital Point' : 'Mottaleb Telecom'}</span>
                </p>
              </div>
            </div>

            {/* Desktop Balance Badge */}
            <div className="hidden sm:flex items-center ml-3">
              {renderBalanceBadge(false)}
            </div>

            {/* Mobile Actions in Top Bar (New button is placed as floating action button at the bottom) */}
            <div className="flex sm:hidden items-center gap-1 shrink-0">
              {userPhone === RESET_ALLOWED_PHONE && (
                <button
                  onClick={() => {
                    setIsResetModalOpen(true);
                    setResetSecurityCode('');
                    setResetError('');
                  }}
                  className="h-8 w-8 flex items-center justify-center text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 rounded-sm transition shadow-xs cursor-pointer active:scale-[0.98]"
                  title="Reset all ledger records"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                </button>
              )}

              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="h-8 w-8 flex items-center justify-center text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-sm transition border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer active:scale-[0.98]"
                title="Refresh"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C5A880]' : ''}`} />
              </button>

              <button
                onClick={handleLogout}
                className="h-8 w-8 flex items-center justify-center text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white hover:bg-rose-50 dark:bg-slate-800/60 dark:hover:bg-rose-950/40 border border-slate-200 dark:border-slate-700/60 rounded-sm transition shadow-xs cursor-pointer active:scale-[0.98]"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Mobile-only prominent Balance Status Banner */}
          <div className="sm:hidden w-full pt-0.5">
            {renderBalanceBadge(true)}
          </div>

          {/* Desktop Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => {
                setIsCreateModalOpen(true);
                stopCamera();
              }}
              className="h-9 px-3.5 text-xs font-semibold bg-[#C5A880] hover:bg-[#B3966F] text-slate-950 rounded-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Transaction</span>
            </button>

            {/* Reset Button (Visible ONLY to Rufaidah Digital Point: 01814558055) */}
            {userPhone === RESET_ALLOWED_PHONE && (
              <button
                onClick={() => {
                  setIsResetModalOpen(true);
                  setResetSecurityCode('');
                  setResetError('');
                }}
                className="h-9 px-3 text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800/40 rounded-sm transition flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.98]"
                title="Reset all ledger records (Rufaidah only)"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400" />
                <span className="hidden sm:inline">Reset Ledger</span>
              </button>
            )}

            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-9 px-3 text-xs font-semibold bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 rounded-sm transition flex items-center gap-1.5 border border-slate-200 dark:border-slate-700/60 shadow-xs cursor-pointer active:scale-[0.98]"
              title="Refresh transactions"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#C5A880]' : ''}`} />
              <span className="hidden sm:inline">{isLoading ? 'Refreshing...' : 'Refresh'}</span>
            </button>

            <button
              onClick={handleLogout}
              className="h-9 px-3 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-white hover:bg-rose-50 dark:bg-slate-800/60 dark:hover:bg-rose-950/40 border border-slate-200 hover:border-rose-300 dark:border-slate-700/60 dark:hover:border-rose-800/40 rounded-sm transition shadow-xs flex items-center gap-1 cursor-pointer active:scale-[0.98]"
              title="Logout from shop"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-6xl mx-auto px-2.5 sm:px-4 pt-3 sm:pt-4 space-y-2.5 sm:space-y-3">
        {/* Responsive Compact Toolbar */}
        <div className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-slate-800 rounded-sm p-2.5 sm:px-4 sm:py-2.5 shadow-xs dark:shadow-md flex flex-wrap items-center justify-between gap-2 sm:gap-3 transition-colors">
          {/* Date Range Filter (Order 1 on all screens) */}
          <div className="order-1 h-8 flex items-center bg-slate-100 dark:bg-[#191A22] border border-slate-200 dark:border-slate-800 p-0.5 rounded-sm text-xs font-medium">
            <button
              onClick={() => setDateRange('today')}
              className={`h-7 px-2.5 sm:px-3 rounded-xs transition ${
                dateRange === 'today' ? 'bg-[#C5A880] text-slate-950 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setDateRange('all')}
              className={`h-7 px-2.5 sm:px-3 rounded-xs transition ${
                dateRange === 'all' ? 'bg-[#C5A880] text-slate-950 font-semibold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Status Filter Dropdown (Order 2 on mobile, Order 3 on desktop) */}
          <div className="order-2 sm:order-3 relative">
            <button
              type="button"
              onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
              className="h-8 px-2.5 sm:px-3 rounded-sm bg-slate-50 hover:bg-slate-100 dark:bg-[#191A22] dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center gap-1.5 transition shadow-xs cursor-pointer focus:outline-none focus:border-[#C5A880]"
            >
              <span className="text-slate-400 dark:text-slate-500 font-medium text-[11px]">Status:</span>
              <span className="capitalize">{selectedStatus === 'all' ? 'All' : selectedStatus}</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 dark:text-slate-500 transition-transform ${isStatusDropdownOpen ? 'rotate-180 text-[#C5A880]' : ''}`} />
            </button>

            {isStatusDropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-30" 
                  onClick={() => setIsStatusDropdownOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1.5 w-36 bg-white dark:bg-[#12131A] border border-slate-200 dark:border-slate-800 rounded-sm shadow-xl dark:shadow-2xl py-1 z-40 animate-in fade-in zoom-in-95 duration-100">
                  {[
                    { value: 'all', label: 'All Status' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'sent', label: 'Sent' },
                    { value: 'received', label: 'Received' },
                    { value: 'rejected', label: 'Rejected' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setSelectedStatus(opt.value);
                        setIsStatusDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-1.5 text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                        selectedStatus === opt.value
                          ? 'bg-[#C5A880]/15 text-[#9E7B4F] dark:text-[#C5A880] font-semibold'
                          : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {selectedStatus === opt.value && (
                        <Check className="w-3.5 h-3.5 text-[#C5A880]" />
                      )}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Paid & Received Metrics (Order 3 full width on mobile, Order 2 flex on desktop) */}
          <div className="order-3 sm:order-2 w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5">
            {/* Paid Chip */}
            <div className="h-8 flex items-center justify-between sm:justify-start gap-1.5 px-2.5 sm:px-3 rounded-sm bg-slate-50 dark:bg-[#161722] border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-1 min-w-0">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#9E7B4F] dark:text-[#C5A880] shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 truncate">
                  {dateRange === 'today' ? 'Paid Today:' : 'Total Paid:'}
                </span>
              </div>
              <span className="text-[#9E7B4F] dark:text-[#C5A880] font-bold text-xs shrink-0">৳ {summary ? (dateRange === 'today' ? summary.todayGiven : summary.totalGiven).toLocaleString() : '0'}</span>
            </div>

            {/* Received Chip */}
            <div className="h-8 flex items-center justify-between sm:justify-start gap-1.5 px-2.5 sm:px-3 rounded-sm bg-slate-50 dark:bg-[#161722] border border-slate-200 dark:border-slate-800 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
              <div className="flex items-center gap-1 min-w-0">
                <ArrowDownLeft className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="text-[10px] sm:text-[11px] font-sans font-medium text-slate-500 dark:text-slate-400 truncate">
                  {dateRange === 'today' ? 'Received Today:' : 'Total Recv:'}
                </span>
              </div>
              <span className="text-amber-600 dark:text-amber-200 font-bold text-xs shrink-0">৳ {summary ? (dateRange === 'today' ? summary.todayTaken : summary.totalTaken).toLocaleString() : '0'}</span>
            </div>
          </div>
        </div>

        {/* Transactions Table / List */}
        <div className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-slate-800 rounded-sm shadow-xs dark:shadow-md overflow-hidden transition-colors">
          {transactions.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-10 h-10 bg-slate-100 dark:bg-[#191A22] border border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 rounded-sm flex items-center justify-center mx-auto mb-2">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-slate-700 dark:text-slate-300 text-xs">No transactions found</h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                No logs match your current filters. Add a new transaction or switch date range.
              </p>
              <button
                onClick={() => {
                  setIsCreateModalOpen(true);
                  stopCamera();
                }}
                className="mt-3 px-4 py-2 text-xs font-semibold bg-[#C5A880] hover:bg-[#B3966F] text-slate-950 rounded-sm shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add First Transaction</span>
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-[#161722] border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="px-3 py-2.5">Time & MFS</th>
                      <th className="px-3 py-2.5">Flow</th>
                      <th className="px-3 py-2.5">Customer Phone</th>
                      <th className="px-3 py-2.5">TrxID / Proof</th>
                      <th className="px-3 py-2.5">Amount</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                    {transactions.map((tx) => {
                      const isSender = tx.sender_phone === userPhone;
                      // Check if current user is the payer (gave money) or receiver (took money)
                      const isPayer = (tx.direction === 'give' && isSender) || (tx.direction === 'take' && !isSender);
                      const mfsMeta = MFS_CONFIG[tx.mfs_type] || MFS_CONFIG.bkash;
                      const formattedDate = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                      const formattedFullDate = new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });

                      return (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                          {/* Time & Official MFS Logo */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-7 flex items-center justify-center p-0.5 bg-white border border-slate-200 dark:border-slate-700/60 rounded-xs shadow-xs shrink-0">
                                <MfsLogo type={tx.mfs_type} className="w-full h-full object-contain" />
                              </div>
                              <div>
                                <div className="font-medium text-slate-900 dark:text-slate-200 text-xs">{formattedDate}</div>
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{formattedFullDate}</div>
                              </div>
                            </div>
                          </td>

                          {/* Direction & Shop Flow */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {isPayer ? (
                                <span className="inline-flex items-center gap-1 font-semibold text-[#8C6B3F] dark:text-[#C5A880] bg-[#C5A880]/15 dark:bg-[#C5A880]/10 px-2 py-0.5 rounded-sm text-[11px] border border-[#C5A880]/30 dark:border-[#C5A880]/20">
                                  <ArrowUpRight className="w-3 h-3 text-[#8C6B3F] dark:text-[#C5A880]" />
                                  <span>Paid</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-400/10 px-2 py-0.5 rounded-sm text-[11px] border border-amber-200 dark:border-amber-400/20">
                                  <ArrowDownLeft className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>Received</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Customer Phone with One-click Copy Button */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {tx.customer_phone ? (
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-medium text-slate-900 dark:text-slate-200 text-xs">{tx.customer_phone}</span>
                                <button
                                  onClick={() => copyToClipboard(tx.customer_phone!, 'phone-' + tx.id)}
                                  className="p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                  title="Copy customer phone"
                                >
                                  {copiedId === 'phone-' + tx.id ? (
                                    <Check className="w-3 h-3 text-[#9E7B4F] dark:text-[#C5A880]" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-400 dark:text-slate-500 italic text-[11px]">—</span>
                            )}
                            {tx.notes && <div className="text-[10px] text-slate-400 dark:text-slate-500 max-w-[130px] truncate">{tx.notes}</div>}
                          </td>

                          {/* TrxID & Proof */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              {tx.trx_id ? (
                                <button
                                  onClick={() => copyToClipboard(tx.trx_id!, String(tx.id))}
                                  className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 px-2 py-0.5 rounded-sm text-[11px] font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60 transition cursor-pointer"
                                  title="Click to copy TrxID"
                                >
                                  <span>{tx.trx_id}</span>
                                  {copiedId === String(tx.id) ? (
                                    <Check className="w-3 h-3 text-[#9E7B4F] dark:text-[#C5A880]" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">—</span>
                              )}

                              {tx.screenshot_url && (
                                <button
                                  onClick={() => setPreviewImage(tx.screenshot_url)}
                                  className="p-1 rounded-sm bg-[#C5A880]/15 hover:bg-[#C5A880]/25 dark:bg-[#C5A880]/10 dark:hover:bg-[#C5A880]/20 text-[#8C6B3F] dark:text-[#C5A880] border border-[#C5A880]/30 transition cursor-pointer"
                                  title="View screenshot proof"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Amount */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            <span className={`font-mono font-bold text-xs ${isPayer ? 'text-[#8C6B3F] dark:text-[#C5A880]' : 'text-amber-700 dark:text-amber-300'}`}>
                              ৳ {Number(tx.amount).toLocaleString()}
                            </span>
                          </td>

                          {/* Status: Role-aware Display */}
                          <td className="px-3 py-2.5 whitespace-nowrap">
                            {tx.status === 'received' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-[#C5A880]/15 text-[#8C6B3F] dark:text-[#C5A880] border border-[#C5A880]/30">
                                <Check className="w-3 h-3 text-[#8C6B3F] dark:text-[#C5A880]" />
                                <span>{isPayer ? 'SENT SUCCESSFUL' : 'RECEIVED'}</span>
                              </span>
                            ) : tx.status === 'sent' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                                <span>{isPayer ? 'SENT (WAITING)' : 'PENDING CONFIRM'}</span>
                              </span>
                            ) : tx.status === 'rejected' ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                                REJECTED
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                {isPayer ? 'PAYMENT REQUESTED' : 'WAITING PAYMENT'}
                              </span>
                            )}
                          </td>

                          {/* Action buttons */}
                          <td className="px-3 py-2.5 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {tx.status === 'received' ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#8C6B3F] dark:text-[#C5A880] bg-[#C5A880]/15 dark:bg-[#C5A880]/10 px-2 py-0.5 rounded-sm border border-[#C5A880]/30 dark:border-[#C5A880]/20">
                                  <Check className="w-3 h-3 text-[#8C6B3F] dark:text-[#C5A880]" />
                                  <span>{isPayer ? 'Paid' : 'Received'}</span>
                                </span>
                              ) : tx.status === 'rejected' ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 px-2 py-0.5 rounded-sm border border-rose-200 dark:border-rose-800/40">
                                    Rejected
                                  </span>
                                  {isSender && (
                                    <button
                                      onClick={() => handleUpdateStatus(tx.id, 'pending')}
                                      className="h-6 px-2 text-[10px] font-medium rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 active:scale-[0.98] transition cursor-pointer"
                                    >
                                      Re-open
                                    </button>
                                  )}
                                </div>
                              ) : (
                                /* Pending or Sent status */
                                isSender ? (
                                  /* When I requested/sent: Waiting for partner */
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 italic">
                                      {tx.direction === 'take' ? 'Waiting for partner to pay' : 'Waiting for partner to confirm'}
                                    </span>
                                    <button
                                      onClick={() => handleUpdateStatus(tx.id, 'rejected')}
                                      className="h-6 px-2 text-[10px] font-medium rounded-sm text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 active:scale-[0.98] transition cursor-pointer"
                                      title="Cancel request"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  /* When Partner requested/sent: I need to act! */
                                  <div className="flex items-center gap-1.5">
                                    {tx.direction === 'take' ? (
                                      /* Partner requested money from me: I click to Copy number, Pay, and Submit TrxID! */
                                      <button
                                        onClick={() => {
                                          setFulfillTx(tx);
                                          setFulfillTrxId('');
                                          setFulfillScreenshot('');
                                          setFulfillNotes('');
                                          stopCamera();
                                        }}
                                        className="h-7 px-3 text-xs font-semibold rounded-sm bg-[#C5A880] hover:bg-[#B3966F] active:scale-[0.98] text-slate-950 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                                        title="Copy number, pay, and send TrxID"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Pay & Send TrxID</span>
                                      </button>
                                    ) : (
                                      /* Partner gave money: I simply confirm I received it */
                                      <button
                                        onClick={() => handleUpdateStatus(tx.id, 'received')}
                                        className="h-7 px-3 text-xs font-semibold rounded-sm bg-[#C5A880] hover:bg-[#B3966F] active:scale-[0.98] text-slate-950 shadow-sm transition cursor-pointer"
                                      >
                                        Confirm Received
                                      </button>
                                    )}
                                    <button
                                      onClick={() => handleUpdateStatus(tx.id, 'rejected')}
                                      className="h-7 px-3 text-xs font-semibold rounded-sm bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 transition shadow-xs cursor-pointer active:scale-[0.98]"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card Feed View (Compact Single-line Row with Tap-to-Expand Details) */}
              <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800/70">
                {transactions.map((tx) => {
                  const isSender = tx.sender_phone === userPhone;
                  const isPayer = (tx.direction === 'give' && isSender) || (tx.direction === 'take' && !isSender);
                  const mfsMeta = MFS_CONFIG[tx.mfs_type] || MFS_CONFIG.bkash;
                  const formattedDate = new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const formattedFullDate = new Date(tx.created_at).toLocaleDateString([], { month: 'short', day: 'numeric' });
                  const isExpanded = expandedTxId === tx.id;

                  // Partner needs to act (e.g. confirm received or pay)
                  const needsMyAction = !isSender && (
                    tx.status === 'sent' || 
                    (tx.status === 'pending' && tx.direction === 'take')
                  );

                  return (
                    <div 
                      key={tx.id} 
                      onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      className={`transition-colors cursor-pointer select-none ${
                        isExpanded 
                          ? 'bg-slate-50/95 dark:bg-[#161722]/95 border-l-2 border-[#C5A880]' 
                          : needsMyAction
                          ? 'bg-amber-50/25 dark:bg-amber-950/15 hover:bg-amber-50/50 dark:hover:bg-amber-950/25'
                          : 'bg-white dark:bg-[#12131A] hover:bg-slate-50/60 dark:hover:bg-slate-900/40'
                      }`}
                    >
                      {/* Compact Single Line Row */}
                      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
                        {/* Left: Official MFS Logo + Customer Phone + Time */}
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-6 flex items-center justify-center p-0.5 bg-white border border-slate-200 dark:border-slate-700/60 rounded-xs shadow-xs shrink-0">
                            <MfsLogo type={tx.mfs_type} className="w-full h-full object-contain" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                                {tx.customer_phone || mfsMeta.name}
                              </span>
                              {needsMyAction && (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" title="Action required" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium leading-none mt-0.5 truncate">
                              {formattedDate} • <span className="uppercase">{tx.customer_phone ? mfsMeta.name : 'No Cust No'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Right: Amount + Direction/Status Badge + Chevron */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <div className={`font-mono font-bold text-xs sm:text-sm leading-tight ${
                              isPayer ? 'text-[#8C6B3F] dark:text-[#C5A880]' : 'text-amber-700 dark:text-amber-400'
                            }`}>
                              {isPayer ? '-' : '+'} ৳ {Number(tx.amount).toLocaleString()}
                            </div>
                            <div className="text-[10px] font-semibold leading-none mt-0.5 flex items-center justify-end">
                              {tx.status === 'received' ? (
                                <span className="text-[#8C6B3F] dark:text-[#C5A880] inline-flex items-center gap-0.5">
                                  {isPayer ? 'Paid' : 'Received'}
                                </span>
                              ) : tx.status === 'sent' ? (
                                isSender ? (
                                  <span className="text-blue-600 dark:text-blue-400 font-medium">Waiting</span>
                                ) : (
                                  <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/70 px-1 py-0.5 rounded-xs">
                                    Confirm?
                                  </span>
                                )
                              ) : tx.status === 'rejected' ? (
                                <span className="text-rose-500 dark:text-rose-400">Rejected</span>
                              ) : (
                                isSender ? (
                                  <span className="text-slate-400 font-medium">Waiting</span>
                                ) : (
                                  <span className="text-amber-700 dark:text-amber-300 font-bold bg-amber-100 dark:bg-amber-950/70 px-1 py-0.5 rounded-xs">
                                    Pay Needed
                                  </span>
                                )
                              )}
                            </div>
                          </div>

                          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                            isExpanded ? 'rotate-180 text-[#C5A880]' : ''
                          }`} />
                        </div>
                      </div>

                      {/* Expandable Details Drawer */}
                      {isExpanded && (
                        <div 
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 pb-3 pt-1 space-y-2.5 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in-50 duration-150"
                        >
                          {/* Row 1: Customer Phone with 1-tap Copy */}
                          <div className="bg-white dark:bg-[#12131A] border border-slate-200 dark:border-slate-800 rounded-sm p-2 flex items-center justify-between gap-2 shadow-xs">
                            <div className="min-w-0">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Customer Number</span>
                              <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate block">
                                {tx.customer_phone || <span className="text-slate-400 font-normal italic">Not provided</span>}
                              </span>
                            </div>
                            {tx.customer_phone && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  copyToClipboard(tx.customer_phone!, 'phone-mob-' + tx.id);
                                }}
                                className="h-7 px-2.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-sm flex items-center gap-1 active:scale-95 transition cursor-pointer shrink-0"
                              >
                                {copiedId === 'phone-mob-' + tx.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#9E7B4F] dark:text-[#C5A880]" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            )}
                          </div>

                          {/* Row 2: TrxID, Proof & Date */}
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[10px] font-semibold text-slate-400 uppercase shrink-0">TrxID:</span>
                              {tx.trx_id ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(tx.trx_id!, 'trx-mob-' + tx.id);
                                  }}
                                  className="inline-flex items-center gap-1 bg-white dark:bg-slate-800/90 px-2 py-0.5 rounded-sm font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 active:scale-95 transition cursor-pointer"
                                  title="Copy TrxID"
                                >
                                  <span className="truncate max-w-[120px]">{tx.trx_id}</span>
                                  {copiedId === 'trx-mob-' + tx.id ? (
                                    <Check className="w-3 h-3 text-[#9E7B4F] dark:text-[#C5A880]" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-slate-400" />
                                  )}
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">—</span>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {tx.screenshot_url && (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(tx.screenshot_url);
                                  }}
                                  className="h-6 px-2 text-[11px] font-medium rounded-sm bg-[#C5A880]/15 dark:bg-[#C5A880]/10 text-[#8C6B3F] dark:text-[#C5A880] border border-[#C5A880]/30 hover:bg-[#C5A880]/20 active:scale-95 transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>Proof</span>
                                </button>
                              )}
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {formattedFullDate}
                              </span>
                            </div>
                          </div>

                          {/* Notes if present */}
                          {tx.notes && (
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/50 rounded-xs p-1.5 border border-slate-200/60 dark:border-slate-700/40">
                              <span className="font-semibold text-slate-400 text-[10px] uppercase mr-1">Note:</span>
                              {tx.notes}
                            </div>
                          )}

                          {/* Action Buttons Section */}
                          <div className="pt-1.5 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/60 gap-2">
                            {/* Status Tag */}
                            <div>
                              {tx.status === 'received' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-[#C5A880]/15 text-[#8C6B3F] dark:text-[#C5A880] border border-[#C5A880]/30">
                                  <Check className="w-3 h-3 text-[#8C6B3F] dark:text-[#C5A880]" />
                                  <span>{isPayer ? 'SENT' : 'RECEIVED'}</span>
                                </span>
                              ) : tx.status === 'sent' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
                                  <span>{isPayer ? 'WAITING' : 'PENDING CONFIRM'}</span>
                                </span>
                              ) : tx.status === 'rejected' ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
                                  REJECTED
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                                  {isPayer ? 'PAYMENT REQUESTED' : 'WAITING PAYMENT'}
                                </span>
                              )}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center gap-2">
                              {tx.status === 'received' ? (
                                <span className="text-[11px] font-semibold text-[#8C6B3F] dark:text-[#C5A880] flex items-center gap-1">
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{isPayer ? 'Paid' : 'Received'}</span>
                                </span>
                              ) : tx.status === 'rejected' ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-semibold text-rose-600 dark:text-rose-400">Rejected</span>
                                  {isSender && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(tx.id, 'pending');
                                      }}
                                      className="h-7 px-2.5 text-xs font-semibold rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 active:scale-95 transition cursor-pointer"
                                    >
                                      Re-open
                                    </button>
                                  )}
                                </div>
                              ) : (
                                isSender ? (
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 italic">
                                      {tx.direction === 'take' ? 'Waiting partner to pay' : 'Waiting partner to confirm'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(tx.id, 'rejected');
                                      }}
                                      className="h-7 px-2.5 text-xs font-semibold rounded-sm text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 bg-rose-50/50 hover:bg-rose-100 dark:bg-rose-950/30 border border-rose-200/60 dark:border-rose-800/40 active:scale-95 transition cursor-pointer"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    {tx.direction === 'take' ? (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setFulfillTx(tx);
                                          setFulfillTrxId('');
                                          setFulfillScreenshot('');
                                          setFulfillNotes('');
                                          stopCamera();
                                        }}
                                        className="h-8 px-3 text-xs font-bold rounded-sm bg-[#C5A880] hover:bg-[#B3966F] active:scale-95 text-slate-950 shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>Pay & Send TrxID</span>
                                      </button>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUpdateStatus(tx.id, 'received');
                                        }}
                                        className="h-8 px-3 text-xs font-bold rounded-sm bg-[#C5A880] hover:bg-[#B3966F] active:scale-95 text-slate-950 shadow-sm transition cursor-pointer"
                                      >
                                        Confirm Received
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUpdateStatus(tx.id, 'rejected');
                                      }}
                                      className="h-8 px-2.5 text-xs font-semibold rounded-sm bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800/40 transition cursor-pointer active:scale-95"
                                    >
                                      Reject
                                    </button>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>

      {/* Mobile Floating Action Button (FAB) for fast 1-tap New Transaction */}
      <button
        onClick={() => {
          setIsCreateModalOpen(true);
          stopCamera();
        }}
        className="sm:hidden fixed bottom-5 right-5 z-40 h-12 px-4 bg-[#C5A880] hover:bg-[#B3966F] active:scale-95 text-slate-950 font-bold rounded-sm shadow-xl flex items-center gap-2 cursor-pointer border border-[#B3966F]"
        aria-label="New Transaction"
      >
        <Plus className="w-5 h-5 stroke-[2.5]" />
        <span className="text-xs uppercase tracking-wider">New Tx</span>
      </button>

      {/* FULFILL REQUEST MODAL: Shop B copies customer number, sends money & submits TrxID */}
      {fulfillTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#12131A] rounded-sm max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-[#C5A880]/15 text-[#9E7B4F] dark:text-[#C5A880] flex items-center justify-center border border-[#C5A880]/30 shadow-xs">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">Pay Request & Submit TrxID</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Send money and submit transaction ID</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setFulfillTx(null);
                }}
                className="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFulfillSubmit} className="mt-4 space-y-3.5">
              {/* Payment Info Card with Copy Customer Number */}
              <div className="bg-slate-50 dark:bg-[#161720] border border-slate-200 dark:border-slate-800 rounded-sm p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">MFS Provider & Amount</span>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-[#191A22] border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-sm">
                    <div className="w-5 h-4 flex items-center justify-center p-0.5 bg-white rounded-xs shrink-0 shadow-xs border border-slate-200 dark:border-transparent">
                      <MfsLogo type={fulfillTx.mfs_type} className="w-full h-full object-contain" />
                    </div>
                    <span className="font-bold text-[11px] text-slate-800 dark:text-slate-200 uppercase">
                      {MFS_CONFIG[fulfillTx.mfs_type]?.name || fulfillTx.mfs_type}
                    </span>
                  </div>
                </div>

                <div className="text-2xl font-bold text-[#8C6B3F] dark:text-[#C5A880] font-mono">
                  ৳ {Number(fulfillTx.amount).toLocaleString()}
                </div>

                {/* Customer Phone Box with Big One-click Copy Button */}
                {fulfillTx.customer_phone ? (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1">
                      Customer Phone Number
                    </span>
                    <div className="flex items-center justify-between bg-white dark:bg-[#191A22] border border-slate-200 dark:border-slate-800 rounded-sm p-2.5">
                      <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100 tracking-wider">
                        {fulfillTx.customer_phone}
                      </span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(fulfillTx.customer_phone!, 'modal-phone')}
                        className={`h-8 px-3 text-xs font-semibold rounded-sm transition flex items-center gap-1.5 active:scale-[0.98] cursor-pointer ${
                          copiedId === 'modal-phone'
                            ? 'bg-[#C5A880] text-slate-950 font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700/60'
                        }`}
                      >
                        {copiedId === 'modal-phone' ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      Tap &quot;Copy Number&quot; to paste into your MFS app and complete the cashout/send money.
                    </p>
                  </div>
                ) : null}
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Copy customer number, send money via MFS app, and submit TrxID below.
                </p>
              </div>

              {/* Step 2: Enter TrxID */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  Transaction ID (TrxID) <span className="text-rose-500 dark:text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BL9A7XYZ"
                  value={fulfillTrxId}
                  onChange={(e) => setFulfillTrxId(e.target.value)}
                  className="w-full text-xs font-mono uppercase px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none"
                  autoFocus
                />
              </div>

              {/* Step 3: Screenshot Proof (Optional) */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-400 block mb-1">
                  Screenshot Proof (Optional)
                </label>

                {isCameraActive && cameraTarget === 'fulfill' ? (
                  <div className="border border-slate-800 rounded-sm p-2.5 bg-black text-white space-y-2">
                    <div className="relative aspect-video bg-black rounded-none overflow-hidden flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        onClick={toggleCameraFacing}
                        className="h-8 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-semibold rounded-sm flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Flip</span>
                      </button>

                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="h-8 px-4 bg-[#C5A880] hover:bg-[#B3966F] text-slate-950 text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition active:scale-[0.98] cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Capture Photo</span>
                      </button>

                      <button
                        type="button"
                        onClick={stopCamera}
                        className="h-8 px-3 bg-slate-800/80 hover:bg-rose-950/60 text-rose-300 border border-slate-700/60 text-xs font-semibold rounded-sm transition active:scale-[0.98] cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : fulfillScreenshot ? (
                  <div className="border border-[#C5A880]/30 bg-[#C5A880]/10 rounded-sm p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={fulfillScreenshot}
                        alt="Captured proof"
                        className="w-10 h-10 object-cover rounded-sm border border-[#C5A880]/40 cursor-pointer shadow-xs"
                        onClick={() => setPreviewImage(fulfillScreenshot)}
                      />
                      <span className="text-xs font-semibold text-[#8C6B3F] dark:text-[#C5A880]">Screenshot Attached</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => triggerCamera('fulfill')}
                        className="h-8 px-3 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-sm flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#8C6B3F] dark:text-[#C5A880]" />
                        <span>Retake</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFulfillScreenshot('')}
                        className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-sm transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => triggerCamera('fulfill')}
                      className="border border-slate-200 dark:border-slate-800 hover:border-[#C5A880] bg-white dark:bg-[#191A22] hover:bg-[#C5A880]/10 p-2.5 rounded-sm flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 transition active:scale-[0.98] cursor-pointer shadow-xs"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#8C6B3F] dark:text-[#C5A880]" />
                      <span className="text-xs font-medium">Camera</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCameraTarget('fulfill');
                        fileInputRef.current?.click();
                      }}
                      className="border border-slate-200 dark:border-slate-800 hover:border-[#C5A880] bg-white dark:bg-[#191A22] hover:bg-[#C5A880]/10 p-2.5 rounded-sm flex items-center justify-center gap-2 text-slate-700 dark:text-slate-300 transition active:scale-[0.98] cursor-pointer shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#8C6B3F] dark:text-[#C5A880]" />
                      <span className="text-xs font-medium">Upload File</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Note */}
              <div>
                <label className="text-[11px] font-medium text-slate-700 dark:text-slate-400 block mb-1">Note (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sent via agent SIM"
                  value={fulfillNotes}
                  onChange={(e) => setFulfillNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setFulfillTx(null);
                  }}
                  className="h-9 px-4 text-xs font-semibold bg-white hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 rounded-sm transition active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={fulfillSubmitting}
                  className="h-9 px-5 text-xs font-semibold bg-[#C5A880] hover:bg-[#B3966F] active:scale-[0.98] text-slate-950 rounded-sm shadow-sm transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{fulfillSubmitting ? 'Submitting...' : 'Submit TrxID & Complete'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Transaction Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 dark:bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#12131A] rounded-sm max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto text-slate-900 dark:text-slate-100 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-sm bg-[#C5A880]/15 text-[#9E7B4F] dark:text-[#C5A880] flex items-center justify-center border border-[#C5A880]/30 shadow-xs">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">New Transaction</h3>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Record a mutual ledger transaction</p>
                </div>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  setIsCreateModalOpen(false);
                }}
                className="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="mt-4 space-y-3.5">
              {/* Direction Selector */}
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                  Transaction Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, direction: 'give', status: 'sent' })}
                    className={`h-11 flex items-center justify-center gap-2 p-2 rounded-sm border text-xs font-semibold transition active:scale-[0.98] cursor-pointer ${
                      formData.direction === 'give'
                        ? 'border-[#C5A880] text-[#8C6B3F] dark:text-[#C5A880] bg-[#C5A880]/15 dark:bg-[#C5A880]/10 ring-1 ring-[#C5A880]/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowUpRight className={`w-3.5 h-3.5 ${formData.direction === 'give' ? 'text-[#8C6B3F] dark:text-[#C5A880]' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>I Paid / Sent Money</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      stopCamera();
                      setFormData({ 
                        ...formData, 
                        direction: 'take', 
                        status: 'pending',
                        trx_id: '',
                        screenshot_url: '' 
                      });
                    }}
                    className={`h-11 flex items-center justify-center gap-2 p-2 rounded-sm border text-xs font-semibold transition active:scale-[0.98] cursor-pointer ${
                      formData.direction === 'take'
                        ? 'border-[#C5A880] text-[#8C6B3F] dark:text-[#C5A880] bg-[#C5A880]/15 dark:bg-[#C5A880]/10 ring-1 ring-[#C5A880]/20'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <ArrowDownLeft className={`w-3.5 h-3.5 ${formData.direction === 'take' ? 'text-[#8C6B3F] dark:text-[#C5A880]' : 'text-slate-400 dark:text-slate-500'}`} />
                    <span>I Received / Took Money</span>
                  </button>
                </div>
              </div>

              {/* MFS Provider Selection with Official Logos */}
              <div>
                <label className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mb-1.5 uppercase tracking-wider">
                  MFS Provider
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['bkash', 'nagad', 'rocket', 'upay'] as MfsProvider[]).map((mfs) => {
                    const cfg = MFS_CONFIG[mfs];
                    const isSelected = formData.mfs_type === mfs;
                    return (
                      <button
                        key={mfs}
                        type="button"
                        onClick={() => setFormData({ ...formData, mfs_type: mfs })}
                        className={`p-2.5 rounded-sm border text-xs font-semibold transition flex flex-col items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer ${
                          isSelected
                            ? 'border-[#C5A880] text-[#8C6B3F] dark:text-[#C5A880] bg-[#C5A880]/15 dark:bg-[#C5A880]/10 ring-1 ring-[#C5A880]/20 shadow-xs'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-slate-900/60 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <div className="w-12 h-8 flex items-center justify-center p-1 bg-white rounded-xs border border-slate-200 dark:border-slate-700/60 shadow-xs">
                          <MfsLogo type={mfs} className="w-full h-full object-contain" />
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-wider ${isSelected ? 'text-[#8C6B3F] dark:text-[#C5A880]' : 'text-slate-600 dark:text-slate-400'}`}>
                          {cfg.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Phone & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Customer Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Amount (৳ BDT)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full text-xs font-mono font-bold px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none"
                  />
                </div>
              </div>

              {/* Conditional Fields: When "I Gave" -> Show TrxID & Screenshot */}
              {formData.direction === 'give' ? (
                <>
                  {/* TrxID & Notes */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Transaction ID (TrxID)</label>
                      <input
                        type="text"
                        placeholder="e.g. BL9A7XYZ"
                        value={formData.trx_id}
                        onChange={(e) => setFormData({ ...formData, trx_id: e.target.value })}
                        className="w-full text-xs font-mono uppercase px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Cashout"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="w-full text-xs px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Screenshot Proof for "I Gave" */}
                  <div>
                    <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                      Screenshot Proof (Optional)
                    </label>

                    {isCameraActive && cameraTarget === 'create' ? (
                      <div className="border border-slate-300 dark:border-slate-800 rounded-sm p-2.5 bg-black text-white space-y-2">
                        <div className="relative aspect-video bg-black rounded-none overflow-hidden flex items-center justify-center">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                          />
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          <button
                            type="button"
                            onClick={toggleCameraFacing}
                            className="h-8 px-3 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border border-slate-700/60 text-xs font-semibold rounded-sm flex items-center gap-1 transition active:scale-[0.98] cursor-pointer"
                            title="Flip Camera"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Flip</span>
                          </button>

                          <button
                            type="button"
                            onClick={capturePhoto}
                            className="h-8 px-4 bg-[#C5A880] hover:bg-[#B3966F] text-slate-950 text-xs font-semibold rounded-sm flex items-center gap-1.5 shadow-sm transition active:scale-[0.98] cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Capture Photo</span>
                          </button>

                          <button
                            type="button"
                            onClick={stopCamera}
                            className="h-8 px-3 bg-slate-800/80 hover:bg-rose-950/60 text-rose-300 border border-slate-700/60 text-xs font-semibold rounded-sm transition active:scale-[0.98] cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : formData.screenshot_url ? (
                      <div className="border border-[#C5A880]/30 bg-[#C5A880]/10 rounded-sm p-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={formData.screenshot_url}
                            alt="Captured proof"
                            className="w-12 h-12 object-cover rounded-sm border border-[#C5A880]/40 shadow-xs cursor-pointer"
                            onClick={() => setPreviewImage(formData.screenshot_url)}
                          />
                          <div>
                            <span className="text-xs font-semibold text-[#8C6B3F] dark:text-[#C5A880] block">Proof Attached</span>
                            <span className="text-[10px] text-slate-500 dark:text-slate-400">Ready to save</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => triggerCamera('create')}
                            className="h-8 px-3 bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700/60 text-slate-700 dark:text-slate-200 text-[11px] font-semibold rounded-sm flex items-center gap-1 shadow-xs transition active:scale-[0.98] cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 text-[#8C6B3F] dark:text-[#C5A880]" />
                            <span>Retake</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, screenshot_url: '' })}
                            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-sm transition cursor-pointer"
                            title="Remove photo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => triggerCamera('create')}
                          className="border border-slate-200 dark:border-slate-800 hover:border-[#C5A880] bg-slate-50 dark:bg-[#191A22] hover:bg-[#C5A880]/10 p-2.5 rounded-sm flex items-center justify-center gap-2 transition text-slate-700 dark:text-slate-300 active:scale-[0.98] cursor-pointer shadow-xs group"
                        >
                          <div className="w-7 h-7 rounded-none bg-[#C5A880]/15 text-[#8C6B3F] dark:text-[#C5A880] flex items-center justify-center">
                            <Camera className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-medium block leading-tight">Camera</span>
                            <span className="text-[10px] text-slate-500 block">Take photo with camera</span>
                          </div>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setCameraTarget('create');
                            fileInputRef.current?.click();
                          }}
                          className="border border-slate-200 dark:border-slate-800 hover:border-[#C5A880] bg-slate-50 dark:bg-[#191A22] hover:bg-[#C5A880]/10 p-2.5 rounded-sm flex items-center justify-center gap-2 transition text-slate-700 dark:text-slate-300 active:scale-[0.98] cursor-pointer shadow-xs group"
                        >
                          <div className="w-7 h-7 rounded-none bg-[#C5A880]/15 text-[#8C6B3F] dark:text-[#C5A880] flex items-center justify-center">
                            <Upload className="w-3.5 h-3.5" />
                          </div>
                          <div className="text-left">
                            <span className="text-xs font-medium block leading-tight">Upload File</span>
                            <span className="text-[10px] text-slate-500 block">Browse from gallery</span>
                          </div>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div>
                  <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">Note (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Received cash from partner"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-[#C5A880] focus:ring-1 focus:ring-[#C5A880]/30 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Partner will send money and provide TrxID upon payment.
                  </p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    stopCamera();
                    setIsCreateModalOpen(false);
                  }}
                  className="h-9 px-4 text-xs font-semibold bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 rounded-sm transition active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="h-9 px-5 text-xs font-semibold bg-[#C5A880] hover:bg-[#B3966F] active:scale-[0.98] text-slate-950 rounded-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? 'Saving...' : 'Save Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* Reset Ledger Modal (Rufaidah: 01814558055 only) */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#12131A] rounded-sm max-w-sm w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
            <div className="text-center">
              <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-sm flex items-center justify-center mx-auto mb-2 border border-rose-200 dark:border-rose-800/40 shadow-xs">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-slate-900 dark:text-slate-100 text-sm">Reset All Ledger Data</h3>
              <p className="text-[11px] text-rose-600 dark:text-rose-400 font-normal mt-1">
                Warning: This will permanently delete all transaction records between Rufaidah Digital Point and Mottaleb Telecom.
              </p>
            </div>

            <form onSubmit={handleResetLedger} className="mt-4 space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Enter Security Code
                </label>
                <input
                  type="password"
                  required
                  placeholder="Security Code (28562)"
                  value={resetSecurityCode}
                  onChange={(e) => {
                    setResetSecurityCode(e.target.value);
                    setResetError('');
                  }}
                  className="w-full text-xs font-mono px-3 py-2 bg-white dark:bg-[#191A22] border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 rounded-sm focus:border-rose-500 focus:ring-1 focus:ring-rose-500/30 focus:outline-none"
                />
                {resetError && (
                  <p className="text-[11px] text-rose-500 font-semibold mt-1">{resetError}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="h-9 px-4 text-xs font-semibold bg-white dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700/60 rounded-sm transition active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting}
                  className="h-9 px-5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-sm shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {resetSubmitting ? 'Resetting...' : 'Confirm Reset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-xs cursor-pointer"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-2xl max-h-[85vh] bg-white dark:bg-[#12131A] rounded-sm border border-slate-200 dark:border-slate-800 overflow-hidden p-3 shadow-2xl text-slate-900 dark:text-slate-100" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center px-2 py-1.5 border-b border-slate-200 dark:border-slate-800">
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200">Proof Preview</span>
              <button onClick={() => setPreviewImage(null)} className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 text-xs font-medium cursor-pointer">✕ Close</button>
            </div>
            <div className="p-2 flex items-center justify-center overflow-auto max-h-[75vh]">
              <img src={previewImage} alt="Screenshot proof" className="max-w-full max-h-[70vh] rounded-none border border-slate-200 dark:border-slate-800 object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* Production Toast Notification Banner */}
      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-[92%] sm:w-auto animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className={`px-4 py-3 rounded-sm shadow-2xl border flex items-center justify-between gap-3 text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-rose-950 text-rose-100 border-rose-800'
              : toast.type === 'success'
              ? 'bg-[#12131A] text-[#C5A880] border-[#C5A880]/50 shadow-[0_4px_24px_rgba(197,168,128,0.2)]'
              : 'bg-slate-900 text-slate-100 border-slate-700'
          }`}>
            <div className="flex items-center gap-2.5">
              {toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#C5A880] shrink-0" />
              ) : (
                <Store className="w-4 h-4 text-slate-300 shrink-0" />
              )}
              <span>{toast.message}</span>
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white transition p-0.5 cursor-pointer shrink-0"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

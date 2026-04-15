import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import {
  MapPin,
  Fuel,
  Navigation,
  Clock,
  Shield,
  User,
  Settings,
  Bell,
  CreditCard,
  History,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Phone,
  MessageSquare,
  Star,
  Truck,
  Smartphone,
  Copy,
  ExternalLink,
  CheckCheck,
  DollarSign,
  Banknote,
  IndianRupee,
  Heart,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { cn, FUEL_TYPES, QUANTITIES, type User as UserType, type Booking } from './lib/utils';
import { useSocket } from './hooks/useSocket';
import { LandingFooter, CompactFooter, PaymentFooter } from './components/Footer';

// â”€â”€â”€ Sub-components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const Button = ({ children, className, variant = 'primary', loading = false, ...props }: any) => {
  const variants = {
    primary: 'bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-900/20',
    secondary: 'bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700',
    outline: 'bg-transparent border border-zinc-700 text-zinc-300 hover:bg-zinc-800',
    ghost: 'bg-transparent text-zinc-400 hover:text-white hover:bg-zinc-800',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/30',
  };
  return (
    <button
      className={cn(
        'relative px-6 py-3 rounded-xl font-medium transition-all active:scale-95 disabled:opacity-50 disabled:pointer-events-none overflow-hidden flex items-center justify-center gap-2',
        variants[variant as keyof typeof variants],
        className
      )}
      disabled={loading}
      {...props}
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center w-full"
          >
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-white/30"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 2, ease: "linear" }}
            />
            <span className="relative z-10">Processing...</span>
          </motion.div>
        ) : (
          <motion.span
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 w-full"
          >
            {children}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
};

const LiquidFuelIcon = ({ fuelType, isSelected }: { fuelType: string, isSelected: boolean }) => {
  const colors: Record<string, string> = {
    'Power Petrol': '#ef4444',
    'Regular Petrol': '#f97316',
    'Diesel': '#71717a'
  };

  return (
    <div className="relative w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center overflow-hidden">
      <Fuel className={cn("w-5 h-5 relative z-10 transition-colors", isSelected ? "text-white" : "text-zinc-400")} />
      <AnimatePresence>
        {isSelected && (
          <motion.div
            initial={{ y: 40 }}
            animate={{ y: 0 }}
            exit={{ y: 40 }}
            transition={{ type: 'spring', damping: 15 }}
            className="absolute inset-0 z-0"
            style={{ backgroundColor: colors[fuelType] || '#ef4444' }}
          >
            <motion.div
              animate={{
                y: [0, -2, 0],
                rotate: [0, 2, -2, 0]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 left-0 right-0 h-2 bg-white/20 blur-sm"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const Odometer = ({ value }: { value: number }) => {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const duration = 500;
    const steps = 20;
    const stepValue = (value - displayValue) / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setDisplayValue(prev => prev + stepValue);
      if (currentStep >= steps) {
        setDisplayValue(value);
        clearInterval(interval);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [value]);

  return (
    <span className="font-mono">
      Rs. {displayValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </span>
  );
};

const MapPinPulse = () => (
  <div className="relative">
    <motion.div
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', bounce: 0.5 }}
    >
      <MapPin className="w-12 h-12 text-red-500 fill-red-500/20" />
    </motion.div>
    <motion.div
      animate={{
        scale: [1, 2],
        opacity: [0.5, 0]
      }}
      transition={{ duration: 2, repeat: Infinity }}
      className="absolute inset-0 bg-red-500 rounded-full blur-md"
    />
  </div>
);

const TruckMovement = ({ status }: { status: string }) => {
  const isArrived = status === 'completed' || status === 'arrived';

  return (
    <div className="relative">
      <motion.div
        layout
        transition={{ type: 'spring', damping: 20, stiffness: 100 }}
      >
        <Truck className="w-12 h-12 text-red-500" />
      </motion.div>
      {isArrived && (
        <div className="absolute inset-0 flex items-center justify-center">
          {[1, 2, 3].map(i => (
            <motion.div
              key={i}
              initial={{ scale: 0.5, opacity: 0.8 }}
              animate={{ scale: 3, opacity: 0 }}
              transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              className="absolute w-8 h-8 border-2 border-red-500 rounded-full"
            />
          ))}
        </div>
      )}
    </div>
  );
};

const SkeletonLoader = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-14 bg-zinc-800 rounded-2xl w-full" />
    <div className="h-14 bg-zinc-800 rounded-2xl w-3/4" />
    <div className="h-14 bg-zinc-800 rounded-2xl w-1/2" />
  </div>
);

const WiggleBadge = ({ count }: { count: number }) => (
  <motion.div
    animate={count > 0 ? {
      rotate: [0, 15, -15, 15, 0],
      scale: [1, 1.1, 1]
    } : {}}
    transition={{ duration: 0.5 }}
    className="relative"
  >
    <Bell className="w-6 h-6" />
    {count > 0 && (
      <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full text-[10px] flex items-center justify-center font-bold">
        {count}
      </span>
    )}
  </motion.div>
);

const Card = ({ children, className }: any) => (
  <div className={cn('bg-zinc-900/50 backdrop-blur-xl border border-white/5 rounded-2xl p-6', className)}>
    {children}
  </div>
);

const AnimatedBackground = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10 bg-black">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.1, 0.2, 0.1],
        x: [0, 50, 0],
        y: [0, 30, 0]
      }}
      transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      className="absolute -top-1/4 -left-1/4 w-[800px] h-[800px] bg-red-600/10 blur-[150px] rounded-full"
    />
    <motion.div
      animate={{
        scale: [1, 1.3, 1],
        opacity: [0.05, 0.15, 0.05],
        x: [0, -40, 0],
        y: [0, -60, 0]
      }}
      transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      className="absolute -bottom-1/4 -right-1/4 w-[900px] h-[900px] bg-zinc-600/5 blur-[150px] rounded-full"
    />
    <motion.div
      animate={{
        scale: [1, 1.1, 1],
        opacity: [0, 0.1, 0],
        x: [0, 100, 0],
      }}
      transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-red-500/5 blur-[180px] rounded-full"
    />
  </div>
);

// â”€â”€â”€ Payment Sub-Components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const MockCardForm = ({ amount, onPaymentSuccess }: any) => {
  const [loading, setLoading] = useState(false);
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      setLoading(true);
      setTimeout(onPaymentSuccess, 1500);
    }} className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs text-zinc-400 uppercase tracking-widest">Card Number</label>
        <div className="bg-black border border-zinc-800 rounded-xl p-3 flex items-center gap-3 focus-within:border-red-500 transition-colors">
          <CreditCard className="w-5 h-5 text-zinc-500" />
          <input type="text" placeholder="0000 0000 0000 0000" className="bg-transparent border-none outline-none w-full text-white font-mono" required />
        </div>
      </div>
      <div className="flex gap-4">
        <div className="space-y-2 flex-1">
          <label className="text-xs text-zinc-400 uppercase tracking-widest">Expiry</label>
          <input type="text" placeholder="MM/YY" className="bg-black border border-zinc-800 rounded-xl p-3 outline-none w-full text-white font-mono focus:border-red-500 transition-colors" required />
        </div>
        <div className="space-y-2 flex-1">
          <label className="text-xs text-zinc-400 uppercase tracking-widest">CVC</label>
          <input type="text" placeholder="123" className="bg-black border border-zinc-800 rounded-xl p-3 outline-none w-full text-white font-mono focus:border-red-500 transition-colors" required />
        </div>
      </div>
      <div className="space-y-2">
        <label className="text-xs text-zinc-400 uppercase tracking-widest">Name on Card</label>
        <input type="text" placeholder="John Doe" className="bg-black border border-zinc-800 rounded-xl p-3 outline-none w-full text-white focus:border-red-500 transition-colors" required />
      </div>
      <div className="pt-2">
        <Button type="submit" className="w-full h-14" loading={loading}>
          Pay Rs.{(amount || 0).toFixed(2)}
        </Button>
      </div>
    </form>
  );
};

// Google Pay-style circular loader â†’ checkmark success animation
const PaymentSuccessAnimation = ({ onDone }: { onDone?: () => void }) => {
  useEffect(() => {
    // Fire confetti
    try {
      confetti({ particleCount: 180, spread: 70, origin: { y: 0.55 }, colors: ['#10b981', '#ffffff', '#ef4444'] });
    } catch (_) { }
    if (onDone) {
      const t = setTimeout(onDone, 2800);
      return () => clearTimeout(t);
    }
  }, []);

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center justify-center h-full gap-5 relative py-8"
    >
      {/* Ripple rings */}
      {[1, 2, 3].map(i => (
        <motion.div
          key={i}
          initial={{ scale: 0.4, opacity: 0.6 }}
          animate={{ scale: 3.5, opacity: 0 }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
          className="absolute w-20 h-20 border-2 border-emerald-500 rounded-full"
        />
      ))}

      {/* Circle â†’ checkmark */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{
          scale: [0, 1.2, 1],
          boxShadow: [
            "0 0 0px rgba(16, 185, 129, 0)",
            "0 0 60px rgba(16, 185, 129, 0.6)",
            "0 0 30px rgba(16, 185, 129, 0.3)"
          ]
        }}
        transition={{ duration: 0.8, ease: 'backOut' }}
        className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.5, type: 'spring', stiffness: 400 }}
        >
          <CheckCheck className="w-12 h-12 text-white" />
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="text-center space-y-1"
      >
        <p className="text-emerald-400 font-black text-2xl tracking-tight">Payment Successful!</p>
        <p className="text-zinc-500 text-sm">Your rescue partner is on the way</p>
      </motion.div>
    </motion.div>
  );
};

// COD Cash received animation
const CashAcceptedAnimation = ({ onComplete }: any) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <motion.div
      initial={{ y: 50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
    >
      <Card className="p-10 flex flex-col items-center bg-emerald-500/10 border-emerald-500/30 max-w-xs mx-4">
        {/* Cash stack pop */}
        <motion.div
          animate={{ y: [0, -24, 0], rotate: [0, -8, 8, 0] }}
          transition={{ duration: 0.7, type: 'spring', bounce: 0.7 }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.5)]">
            <Banknote className="w-14 h-14 text-white" />
          </div>
        </motion.div>


        {/* Glow pulse */}
        <motion.div
          animate={{ boxShadow: ['0 0 0px rgba(16,185,129,0)', '0 0 80px rgba(16,185,129,0.4)', '0 0 0px rgba(16,185,129,0)'] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl pointer-events-none"
        />

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-2xl font-black text-emerald-400 text-center"
        >
          Cash Received
        </motion.h3>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-zinc-400 mt-2 text-center font-medium"
        >
          Delivery Completed Successfully
        </motion.p>

        {/* Progress bar */}
        <motion.div
          className="mt-6 h-1 bg-emerald-500/30 rounded-full overflow-hidden w-full"
        >
          <motion.div
            className="h-full bg-emerald-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 3, ease: 'linear' }}
          />
        </motion.div>
      </Card>
    </motion.div>
  );
};

// --- UPI Payment Component ---

const STATIC_UPI_ID = '6309691674@ptsbi';
const STATIC_MERCHANT_NAME = 'Kattipalli Navaneeth';
const STATIC_UPI_URL = `upi://pay?pa=${encodeURIComponent(STATIC_UPI_ID)}&pn=${encodeURIComponent(STATIC_MERCHANT_NAME)}&cu=INR`;

// Spectacular full-screen UPI success animation
const UpiPaymentPanel = ({
  booking,
  onPaymentVerified,
}: {
  booking: any;
  onPaymentVerified: () => void;
}) => {
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [copied, setCopied] = useState(false);
  const [upiError, setUpiError] = useState('');
  const [launchingApp, setLaunchingApp] = useState<string | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [utrRef, setUtrRef] = useState('');

  const amount = booking?.total_price || booking?.total_amount || 0;

  const gpayUrl = `tez://upi/pay?pa=${encodeURIComponent(STATIC_UPI_ID)}&pn=${encodeURIComponent(STATIC_MERCHANT_NAME)}&cu=INR`;
  const phonePeUrl = `phonepe://pay?pa=${encodeURIComponent(STATIC_UPI_ID)}&pn=${encodeURIComponent(STATIC_MERCHANT_NAME)}&cu=INR`;
  const paytmUrl = `paytmmp://pay?pa=${encodeURIComponent(STATIC_UPI_ID)}&pn=${encodeURIComponent(STATIC_MERCHANT_NAME)}&cu=INR`;

  const openUpiApp = (url: string, appKey: string) => {
    setLaunchingApp(appKey);
    const newTab = window.open(url, '_blank');
    if (!newTab || newTab.closed || typeof newTab.closed === 'undefined') {
      window.location.href = url;
    }
    setTimeout(() => setLaunchingApp(null), 3000);
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(STATIC_UPI_ID).catch(() => { });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleVerifyPayment = async () => {
    if (utrInput.trim().length < 6) {
      setUpiError('Please enter a valid UTR / Transaction ID.');
      return;
    }
    setVerifying(true);
    setUpiError('');
    try {
      const res = await fetch('/api/payments/verify-upi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: booking.id, transactionRef: utrInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setUtrRef(utrInput.trim());
        setVerified(true);
        setTimeout(onPaymentVerified, 1400);
      } else {
        setUpiError('Verification failed. Please try again.');
      }
    } catch {
      setUpiError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  };

  const upiApps = [
    {
      key: 'gpay', label: 'Google Pay', url: gpayUrl,
      icon: (<div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-lg"><span className="text-2xl font-black text-blue-600">G</span></div>),
      activeColor: 'border-blue-500 bg-blue-500/10', hoverColor: 'hover:border-blue-500/50 hover:bg-blue-500/5',
      labelColor: 'group-hover:text-blue-400', ringColor: 'border-blue-400',
    },
    {
      key: 'phonepe', label: 'PhonePe', url: phonePeUrl,
      icon: (<div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-900/40"><span className="text-white font-black text-base">Pe</span></div>),
      activeColor: 'border-indigo-500 bg-indigo-500/10', hoverColor: 'hover:border-indigo-500/50 hover:bg-indigo-500/5',
      labelColor: 'group-hover:text-indigo-400', ringColor: 'border-indigo-400',
    },
    {
      key: 'paytm', label: 'Paytm', url: paytmUrl,
      icon: (<div className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center shadow-lg shadow-sky-900/40"><span className="text-white font-black text-sm">Pay</span></div>),
      activeColor: 'border-sky-500 bg-sky-500/10', hoverColor: 'hover:border-sky-500/50 hover:bg-sky-500/5',
      labelColor: 'group-hover:text-sky-400', ringColor: 'border-sky-400',
    },
  ];

  return (
    <div className="space-y-4">

      {/* Amount to pay - user enters this in their UPI app */}
      <div className="bg-amber-500/10 border-2 border-amber-500/40 rounded-2xl p-4 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <IndianRupee className="w-7 h-7 text-amber-400" />
        </div>
        <div>
          <p className="text-xs text-amber-400/80 uppercase tracking-widest font-semibold mb-0.5">
            Enter this amount in your UPI app
          </p>
          <p className="text-3xl font-black text-white">Rs. {amount.toFixed(2)}</p>
        </div>
      </div>

      {/* Static QR Code */}
      <div className="bg-zinc-950 border-2 border-violet-500/30 rounded-2xl p-6 flex flex-col items-center gap-4">
        <div className="text-center space-y-1">
          <p className="text-white font-bold text-base">Scan QR to Pay</p>
          <p className="text-zinc-400 text-sm">Open any UPI app &rarr; Scan QR &rarr; Enter amount &rarr; Pay</p>
        </div>
        <div className="relative">
          <div className="absolute -inset-2 bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 rounded-3xl blur-lg" />
          <div className="relative bg-white p-5 rounded-2xl shadow-2xl">
            <QRCodeSVG value={STATIC_UPI_URL} size={220} bgColor="#ffffff" fgColor="#000000" level="M" />
          </div>
        </div>
        <p className="text-zinc-400 text-sm font-semibold">{STATIC_MERCHANT_NAME}</p>
        <div className="w-full grid grid-cols-3 gap-2">
          {[
            { n: '1', label: 'Scan QR' },
            { n: '2', label: 'Enter Rs. ' + amount.toFixed(2) },
            { n: '3', label: 'Confirm & Pay' },
          ].map(step => (
            <div key={step.n} className="flex flex-col items-center gap-1.5 text-center">
              <div className="w-7 h-7 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 text-xs font-black">{step.n}</div>
              <span className="text-[10px] text-zinc-500 leading-tight">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* UPI ID copy */}
      <div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-semibold mb-2">Or pay using UPI ID</p>
        <button onClick={copyUpiId} className="w-full flex items-center justify-between gap-3 px-4 py-3 bg-zinc-900 border border-zinc-700 hover:border-violet-500/50 rounded-xl transition-all group">
          <span className="text-zinc-200 font-mono text-sm truncate">{STATIC_UPI_ID}</span>
          <div className={cn('shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-lg transition-colors', copied ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-400 group-hover:bg-violet-500/20 group-hover:text-violet-300')}>
            {copied ? <><CheckCircle2 className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy</>}
          </div>
        </button>
      </div>

      {/* UPI App Buttons */}
      <div>
        <p className="text-xs text-zinc-500 uppercase tracking-widest font-semibold mb-3">Or open UPI app directly</p>
        <div className="grid grid-cols-3 gap-3">
          {upiApps.map((app) => {
            const isLaunching = launchingApp === app.key;
            return (
              <motion.button
                key={app.key}
                onClick={() => openUpiApp(app.url, app.key)}
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.95 }}
                disabled={!!launchingApp}
                className={cn('group relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all duration-200 overflow-hidden disabled:opacity-70', isLaunching ? app.activeColor : `bg-zinc-900 border-zinc-800 ${app.hoverColor}`)}
              >
                {isLaunching && (
                  <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.7, 0, 0.7] }} transition={{ duration: 1, repeat: Infinity }} className={cn('absolute inset-0 rounded-2xl border-2', app.ringColor)} />
                )}
                <div className="relative">
                  {app.icon}
                  {isLaunching && (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} className="absolute -inset-1.5 rounded-2xl border-2 border-t-transparent border-white/40" />
                  )}
                </div>
                <span className={cn('text-[10px] font-bold uppercase tracking-wider transition-colors', isLaunching ? 'text-white' : `text-zinc-400 ${app.labelColor}`)}>
                  {isLaunching ? 'Opening...' : app.label}
                </span>
              </motion.button>
            );
          })}
        </div>
        <AnimatePresence>
          {launchingApp && (
            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-zinc-900 border border-zinc-700 rounded-xl">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full shrink-0" />
              <p className="text-xs text-zinc-400">
                Opening <span className="text-white font-semibold">{launchingApp === 'gpay' ? 'Google Pay' : launchingApp === 'phonepe' ? 'PhonePe' : 'Paytm'}</span> - enter <span className="text-amber-400 font-bold">Rs. {amount.toFixed(2)}</span> when prompted
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Any UPI app */}
      <button onClick={() => openUpiApp(STATIC_UPI_URL, 'any')} disabled={!!launchingApp} className="w-full flex items-center justify-between px-5 py-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 transition-all active:scale-95 disabled:opacity-50">
        <div className="flex items-center gap-3">
          <ExternalLink className="w-5 h-5 text-zinc-400" />
          <span className="text-sm font-semibold text-zinc-300">Any Other UPI App</span>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-600" />
      </button>


      {/* UTR / Transaction ID Entry */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold mb-1">
            Step 2 &mdash; Confirm your payment
          </p>
          <p className="text-xs text-zinc-600">
            After paying, open your UPI app &rarr; Payment History &rarr; Copy UTR / Transaction ID
          </p>
        </div>

        {/* UTR input */}
        <div className="relative">
          <input
            type="text"
            value={utrInput}
            onChange={e => { setUtrInput(e.target.value); setUpiError(''); }}
            placeholder="Paste UTR / Transaction ID (e.g. 123456789012)"
            className="w-full bg-zinc-900/80 border border-zinc-700 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 rounded-xl px-4 py-3.5 pr-11 text-white font-mono text-sm outline-none transition-all placeholder:text-zinc-600"
          />
          {utrInput.length >= 6 && (
            <motion.div
              initial={{ scale: 0 }} animate={{ scale: 1 }}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            </motion.div>
          )}
        </div>

        {/* Error */}
        <AnimatePresence>
          {upiError && (
            <motion.p
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="text-red-400 text-xs font-medium flex items-center gap-1.5"
            >
              <AlertCircle className="w-3.5 h-3.5" /> {upiError}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Confirm button */}
        <Button
          variant="success"
          className="w-full h-14 text-base font-black tracking-wide"
          loading={verifying}
          disabled={utrInput.trim().length < 6}
          onClick={handleVerifyPayment}
        >
          <CheckCheck className="w-5 h-5" />
          Confirm Payment
        </Button>
        <p className="text-center text-[10px] text-zinc-600">
          Enter the UTR from your UPI app to confirm
        </p>
      </motion.div>

      {/* Payment confirmed */}
      {verified && (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center justify-center gap-2 py-4 rounded-xl bg-emerald-600/20 border border-emerald-600/40">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span className="text-emerald-400 font-bold">Payment Verified!</span>
        </motion.div>
      )}

    </div>
  );
};
// â”€â”€â”€ Main App Component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function App() {
  const [user, setUser] = useState<UserType | null>(null);
  const [view, setView] = useState<'landing' | 'auth' | 'user' | 'driver' | 'admin'>('landing');
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState({ lat: 12.9716, lng: 77.5946 });

  const login = async (email: string, password?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Login failed');
        return;
      }
      setUser(data.user);
      setView(data.user.role || 'user');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email: string, password?: string, name?: string, role?: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });
      const data = await res.json();
      if (!data.success) {
        alert(data.message || 'Signup failed');
        return;
      }
      setUser(data.user);
      setView(data.user.role || 'user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      });
    }
  }, []);

  return (
    <div className="min-h-screen text-white font-sans selection:bg-red-500/30">
      <AnimatedBackground />
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <LandingPage onGetStarted={() => setView('auth')} />
        )}
        {view === 'auth' && (
          <AuthScreen onLogin={login} onSignup={signup} loading={loading} />
        )}
        {view === 'user' && (
          <UserApp
            user={user!}
            location={location}
            activeBooking={activeBooking}
            setActiveBooking={setActiveBooking}
            onLogout={() => setView('landing')}
          />
        )}
        {view === 'driver' && (
          <RescuePartnerApp
            user={user!}
            onLogout={() => setView('landing')}
          />
        )}
        {view === 'admin' && (
          <AdminDashboard
            user={user!}
            onLogout={() => setView('landing')}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// â”€â”€â”€ Screens â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function LandingPage({ onGetStarted }: { onGetStarted: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-black overflow-x-hidden"
    >
      {/* Hero Section */}
      <section className="relative h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-red-600/20 blur-[120px] rounded-full"
          />
          <motion.div
            animate={{
              scale: [1, 1.3, 1],
              opacity: [0.05, 0.15, 0.05],
            }}
            transition={{ duration: 10, repeat: Infinity, delay: 1 }}
            className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-zinc-600/10 blur-[120px] rounded-full"
          />
        </div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="relative z-10"
        >
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-[2rem] bg-red-600 mb-8 shadow-2xl shadow-red-600/40">
            <Fuel className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 bg-gradient-to-b from-white to-zinc-500 bg-clip-text text-transparent">
            FUELRESQ
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-2xl mx-auto mb-12 leading-relaxed">
            Stranded without fuel? We deliver emergency fuel to your location in <span className="text-red-500 font-bold">15 minutes</span> or less.
          </p>
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <Button onClick={onGetStarted} className="py-5 px-12 text-lg rounded-2xl">
              Get Rescued Now
            </Button>
            <Button variant="outline" className="py-5 px-12 text-lg rounded-2xl" onClick={() => {
              document.getElementById('details')?.scrollIntoView({ behavior: 'smooth' });
            }}>
              Learn More
            </Button>
          </div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 text-zinc-600"
        >
          <ChevronRight className="w-8 h-8 rotate-90" />
        </motion.div>
      </section>

      {/* Details Section */}
      <section id="details" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
          <Card className="p-8 space-y-4 border-red-600/20 hover:border-red-600/40 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-red-600/10 flex items-center justify-center">
              <Clock className="w-7 h-7 text-red-500" />
            </div>
            <h3 className="text-2xl font-bold">15-Min Guarantee</h3>
            <p className="text-zinc-400 leading-relaxed">
              Our smart dispatch system ensures the nearest driver reaches you within 15 minutes. If we're late, you get a credit.
            </p>
          </Card>
          <Card className="p-8 space-y-4 border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <MapPin className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Live Tracking</h3>
            <p className="text-zinc-400 leading-relaxed">
              Watch your fuel truck move in real-time on the map. Know exactly when help will arrive with our live ETA.
            </p>
          </Card>
          <Card className="p-8 space-y-4 border-zinc-800 hover:border-zinc-700 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center">
              <Shield className="w-7 h-7 text-emerald-500" />
            </div>
            <h3 className="text-2xl font-bold">Safe & Certified</h3>
            <p className="text-zinc-400 leading-relaxed">
              All our delivery partners are certified fuel handlers using specialized equipment for safe roadside refueling.
            </p>
          </Card>
        </div>

        {/* Fuel Types Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4">What We Supply</h2>
          <p className="text-zinc-500">High-quality fuel for all types of vehicles</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FUEL_TYPES.map((fuel) => (
            <div key={fuel.id} className="group relative rounded-3xl overflow-hidden bg-zinc-900/50 border border-white/5 p-1">
              <div className="absolute inset-0 bg-gradient-to-b from-red-600/0 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-8 relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Fuel className="w-8 h-8 text-red-500" />
                </div>
                <h4 className="text-2xl font-bold mb-2">{fuel.name}</h4>
                <p className="text-zinc-400 mb-6">
                  {fuel.id === 'super98' && "Premium high-octane fuel for performance engines and luxury vehicles."}
                  {fuel.id === 'special95' && "Standard high-quality petrol suitable for most modern passenger cars."}
                  {fuel.id === 'diesel' && "High-efficiency diesel for trucks, SUVs, and commercial vehicles."}
                </p>
                <div className="text-3xl font-black text-white">Rs.{fuel.price}<span className="text-sm font-normal text-zinc-500">/L</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <LandingFooter />
    </motion.div>
  );
}

function AuthScreen({ onLogin, onSignup, loading }: { onLogin: any, onSignup: any, loading: boolean }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'user' | 'driver' | 'admin'>('user');
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [step, setStep] = useState<'email' | 'password' | 'details'>('email');
  const [error, setError] = useState('');

  const handleNext = () => {
    setError('');
    if (email) {
      if (mode === 'signup') {
        setStep('details');
      } else {
        setStep('password');
      }
    } else {
      setError('Please enter your email address');
    }
  };

  const handleSubmit = async () => {
    setError('');
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onSignup(email, password, name, role);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-zinc-600/5 blur-[120px] rounded-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-red-600 mb-6 shadow-2xl shadow-red-600/20">
            <Fuel className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">FuelresQ</h1>
          <p className="text-zinc-400">15-Minute Emergency Fuel Guarantee</p>
        </div>

        <Card className="space-y-6">
          <div className="flex bg-black/50 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => { setMode('login'); setStep('email'); setError(''); }}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", mode === 'login' ? "bg-zinc-800 text-white" : "text-zinc-500")}
            >
              Login
            </button>
            <button
              onClick={() => { setMode('signup'); setStep('email'); setError(''); }}
              className={cn("flex-1 py-2 rounded-lg text-sm font-medium transition-all", mode === 'signup' ? "bg-zinc-800 text-white" : "text-zinc-500")}
            >
              Sign Up
            </button>
          </div>

          <AnimatePresence mode="wait">
            {step === 'email' && (
              <motion.div
                key="email"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className={cn(
                      "w-full bg-black/50 border rounded-xl px-4 py-3 focus:outline-none transition-colors",
                      error ? "border-red-600" : "border-zinc-800 focus:border-red-600"
                    )}
                  />
                  {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                </div>
                <Button className="w-full py-4 rounded-xl" onClick={handleNext}>Continue</Button>
              </motion.div>
            )}

            {step === 'details' && mode === 'signup' && (
              <motion.div
                key="details"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Account Type</label>
                  <select
                    value={role}
                    onChange={(e: any) => setRole(e.target.value)}
                    className="w-full bg-black/50 border border-zinc-800 rounded-xl px-4 py-3 focus:outline-none focus:border-red-600 transition-colors appearance-none"
                  >
                    <option value="user">User</option>
                    <option value="driver">Rescue Partner</option>
                  </select>
                </div>
                <Button className="w-full py-4 rounded-xl" onClick={() => setStep('password')}>Next</Button>
              </motion.div>
            )}

            {step === 'password' && (
              <motion.div
                key="password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢"
                    className={cn(
                      "w-full bg-black/50 border rounded-xl px-4 py-3 focus:outline-none transition-colors",
                      error ? "border-red-600" : "border-zinc-800 focus:border-red-600"
                    )}
                  />
                  {error && <p className="text-red-500 text-xs mt-2 font-medium">{error}</p>}
                </div>
                <Button
                  className="w-full py-4 rounded-xl"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {mode === 'login' ? 'Login' : 'Create Account'}
                </Button>
                <button onClick={() => setStep('email')} className="w-full text-zinc-500 text-sm hover:text-white transition-colors">Back</button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-zinc-800"></div></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-zinc-900 px-2 text-zinc-500">India</span></div>
          </div>
        </Card>

        <CompactFooter />
      </motion.div>
    </div>
  );
}

function UserApp({ user, location, activeBooking, setActiveBooking, onLogout }: any) {
  const [step, setStep] = useState<'location_choice' | 'home' | 'select' | 'payment' | 'tracking'>('location_choice');
  const [activeTab, setActiveTab] = useState<'explore' | 'history' | 'alerts' | 'profile'>('explore');
  const [selectedFuel, setSelectedFuel] = useState(FUEL_TYPES[0]);
  const [selectedQty, setSelectedQty] = useState(10);
  const [manualAddress, setManualAddress] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const socket = useSocket(activeBooking ? `booking_${activeBooking.id}` : undefined);
  const [driverPos, setDriverPos] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);

  // Payment state
  const [paymentMethodSelect, setPaymentMethodSelect] = useState<'card' | 'qr' | 'cod'>('card');
  const [paymentSuccessData, setPaymentSuccessData] = useState(false);

  useEffect(() => {
    if (socket) {
      socket.on('driver_location', (data) => setDriverPos(data));
      socket.on('booking_status', (data) => {
        setActiveBooking((prev: any) => ({ ...prev, status: data.status }));
      });
    }
  }, [socket]);

  useEffect(() => {
    if (activeTab === 'history' || activeTab === 'profile') {
      fetch(`/api/bookings/history/${user.id}`)
        .then(res => res.json())
        .then(setHistory);
    }
    if (activeTab === 'alerts') {
      setAlerts([
        { id: 1, title: 'High Demand', message: 'High demand in Indiranagar. Deliveries might take slightly longer.', type: 'warning' },
        { id: 2, title: 'Safety Update', message: 'All our partners have completed their monthly safety audit.', type: 'info' }
      ]);
    }
  }, [activeTab]);

  const handleBooking = async () => {
    setError('');
    if (!plateNumber) {
      setError("Please enter your vehicle plate number");
      const el = document.getElementById('plate-input');
      if (el) {
        el.classList.add('animate-shake');
        setTimeout(() => el.classList.remove('animate-shake'), 500);
      }
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const bookingPayload = {
        userId: user.id,
        fuelType: selectedFuel.name,
        quantity: selectedQty,
        lat: location.lat,
        lng: location.lng,
        address: manualAddress || 'MG Road, Bangalore, India',
        plateNumber: plateNumber
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Server error' }));
        setError(errData.error || errData.message || 'Failed to create booking');
        setLoading(false);
        return;
      }

      const data = await res.json();

      if (!data || !data.id) {
        setError('Invalid booking response');
        setLoading(false);
        return;
      }

      const bookingData = {
        ...data,
        total_price: data.total_amount || (selectedFuel.price * selectedQty + 49)
      };

      setLoading(false);
      setActiveBooking(bookingData);

      setTimeout(() => {
        setStep('payment');
      }, 100);
    } catch (err: any) {
      setError('Failed to create booking. Please try again.');
      setLoading(false);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(() => {
        setStep('home');
      }, () => {
        setError('Location permission denied. Please enter manually.');
        setStep('location_choice');
      });
    }
  };

  // Called after any payment method succeeds
  const handlePaymentSuccess = useCallback(async (method: string) => {
    setPaymentSuccessData(true);
    try {
      await fetch('/api/payments/status-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: activeBooking?.id, status: 'success', method })
      });
    } catch { }
  }, [activeBooking]);

  const handlePaymentSuccessAnimDone = useCallback(() => {
    setPaymentSuccessData(false);
    setStep('tracking');
  }, []);

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <header className="p-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
            <User className="w-5 h-5 text-zinc-400" />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-medium">Welcome back,</p>
            <p className="font-semibold">{user.name}</p>
          </div>
        </div>
        <button onClick={onLogout} className="p-2 text-zinc-500 hover:text-white"><Settings className="w-6 h-6" /></button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-24">
        {activeTab === 'explore' && (
          <div>
            {step === 'location_choice' && (
              <div className="space-y-8 pt-12">
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 rounded-3xl bg-red-600/10 flex items-center justify-center mx-auto">
                    <MapPin className="w-10 h-10 text-red-500" />
                  </div>
                  <h2 className="text-3xl font-bold">Where are you?</h2>
                  <p className="text-zinc-400">We need your location to send a Rescue Partner.</p>
                </div>

                <div className="space-y-4">
                  <Button className="w-full py-6 rounded-2xl" onClick={useCurrentLocation}>
                    <Navigation className="w-5 h-5" />
                    Use Current Location
                  </Button>
                  <Button variant="secondary" className="w-full py-6 rounded-2xl" onClick={() => setStep('home')}>
                    <Settings className="w-5 h-5" />
                    Enter Manually
                  </Button>
                </div>
                {error && <p className="text-red-500 text-center text-sm font-medium">{error}</p>}
              </div>
            )}

            {step === 'home' && (
              <div className="space-y-8">
                <div className="relative h-64 rounded-3xl overflow-hidden border border-white/5">
                  <img
                    src="https://picsum.photos/seed/bangalore/800/600"
                    className="w-full h-full object-cover opacity-50 grayscale"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 text-red-500 mb-2">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm font-medium">MG Road, Bangalore</span>
                    </div>
                    <h2 className="text-2xl font-bold">Stranded? We're here.</h2>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center"><Clock className="w-6 h-6 text-red-500" /></div>
                    <p className="text-sm font-medium">15 Min Guarantee</p>
                  </Card>
                  <Card className="p-4 flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center"><Shield className="w-6 h-6 text-emerald-500" /></div>
                    <p className="text-sm font-medium">Safe Handling</p>
                  </Card>
                </div>

                <Button
                  className="w-full py-6 text-xl rounded-3xl"
                  onClick={() => setStep('select')}
                >
                  EMERGENCY FUEL NOW
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            )}

            {step === 'select' && (
              <div className="space-y-8">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setStep('home')} className="p-2 bg-zinc-900 rounded-xl"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                  <h2 className="text-2xl font-bold">Request Fuel</h2>
                </div>

                <section>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Select Fuel Type</label>
                  <div className="grid grid-cols-1 gap-3">
                    {FUEL_TYPES.map(fuel => (
                      <button
                        key={fuel.id}
                        onClick={() => setSelectedFuel(fuel)}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-2xl border transition-all",
                          selectedFuel.id === fuel.id ? "bg-red-600/10 border-red-600" : "bg-zinc-900 border-zinc-800"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <LiquidFuelIcon fuelType={fuel.name} isSelected={selectedFuel.id === fuel.id} />
                          <div className="text-left">
                            <p className="font-semibold">{fuel.name}</p>
                            <p className="text-xs text-zinc-500">Rs. {fuel.price}/L</p>
                          </div>
                        </div>
                        {selectedFuel.id === fuel.id && <CheckCircle2 className="w-6 h-6 text-red-600" />}
                      </button>
                    ))}
                  </div>
                </section>

                <section>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Vehicle Details</label>
                  <div className="space-y-3">
                    <div id="plate-input" className={cn("flex items-center gap-3 p-4 bg-zinc-900 border rounded-2xl transition-all", error ? "border-red-600" : "border-zinc-800")}>
                      <CreditCard className="w-5 h-5 text-zinc-400" />
                      <input
                        type="text"
                        value={plateNumber}
                        onChange={(e) => setPlateNumber(e.target.value)}
                        placeholder="Vehicle Number Plate (e.g. KA 01 AB 1234)"
                        className="bg-transparent border-none outline-none w-full text-sm"
                      />
                    </div>
                    {error && <p className="text-red-500 text-xs font-medium px-1">{error}</p>}
                  </div>
                </section>

                <section>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Delivery Location</label>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <input
                        type="text"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        placeholder="Enter manual address (Optional)"
                        className="bg-transparent border-none outline-none w-full text-sm"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 px-1">Leave empty to use current GPS location</p>
                  </div>
                </section>

                <section>
                  <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Quantity (Liters)</label>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {QUANTITIES.map(qty => (
                      <button
                        key={qty}
                        onClick={() => setSelectedQty(qty)}
                        className={cn(
                          "py-3 rounded-xl border font-semibold transition-all",
                          selectedQty === qty ? "bg-white text-black border-white" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                        )}
                      >
                        {qty}L
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl">
                    <Fuel className="w-5 h-5 text-zinc-400" />
                    <input
                      type="number"
                      value={selectedQty}
                      onChange={(e) => setSelectedQty(parseFloat(e.target.value) || 0)}
                      placeholder="Enter custom quantity"
                      className="bg-transparent border-none outline-none w-full text-sm"
                    />
                  </div>
                </section>

                <div className="pt-8 border-t border-zinc-800 space-y-4">
                  <div className="flex justify-between text-zinc-400">
                    <span>Fuel Cost</span>
                    <span>Rs. {(selectedFuel.price * selectedQty).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Emergency Fee</span>
                    <span>Rs. 49.00</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span>Rs. {(selectedFuel.price * selectedQty + 49).toFixed(2)}</span>
                  </div>
                  <Button className="w-full py-4 rounded-2xl" onClick={handleBooking} loading={loading}>
                    Confirm & Pay
                  </Button>
                </div>
              </div>
            )}

            {step === 'payment' && activeBooking && (
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setStep('select')} className="p-2 bg-zinc-900 rounded-xl"><ChevronRight className="w-6 h-6 rotate-180" /></button>
                  <h2 className="text-2xl font-bold">Payment</h2>
                </div>

                {paymentSuccessData ? (
                  <div className="h-80">
                    <PaymentSuccessAnimation onDone={handlePaymentSuccessAnimDone} />
                  </div>
                ) : (
                  <>
                    {/* Payment Method Tabs */}
                    <div className="flex bg-zinc-900 rounded-xl p-1 mb-6">
                      <button
                        onClick={() => setPaymentMethodSelect('card')}
                        className={cn("flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5", paymentMethodSelect === 'card' ? "bg-red-600 text-white" : "text-zinc-400")}
                      >
                        <CreditCard className="w-4 h-4" /> Card
                      </button>
                      <button
                        onClick={() => setPaymentMethodSelect('qr')}
                        className={cn("flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5", paymentMethodSelect === 'qr' ? "bg-red-600 text-white" : "text-zinc-400")}
                      >
                        <Smartphone className="w-4 h-4" /> UPI
                      </button>
                      <button
                        onClick={() => setPaymentMethodSelect('cod')}
                        className={cn("flex-1 py-3 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5", paymentMethodSelect === 'cod' ? "bg-red-600 text-white" : "text-zinc-400")}
                      >
                        <Banknote className="w-4 h-4" /> Cash
                      </button>
                    </div>

                    <AnimatePresence mode="wait">
                      {/* â”€â”€â”€ CARD â”€â”€â”€ */}
                      {paymentMethodSelect === 'card' && (
                        <motion.div
                          key="card"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          <Card className="p-6">
                            <MockCardForm
                              amount={activeBooking.total_price || activeBooking.total_amount}
                              onPaymentSuccess={() => handlePaymentSuccess('card')}
                            />
                          </Card>
                        </motion.div>
                      )}

                      {/* â”€â”€â”€ UPI â”€â”€â”€ */}
                      {paymentMethodSelect === 'qr' && (
                        <motion.div
                          key="upi"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          <UpiPaymentPanel
                            booking={activeBooking}
                            onPaymentVerified={() => handlePaymentSuccess('upi')}
                          />
                        </motion.div>
                      )}

                      {/* â”€â”€â”€ COD â”€â”€â”€ */}
                      {paymentMethodSelect === 'cod' && (
                        <motion.div
                          key="cod"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10 }}
                        >
                          <Card className="p-6 text-center space-y-6">
                            {/* Animated cash icon */}
                            <motion.div
                              animate={{ y: [0, -8, 0] }}
                              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                              className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(0,0,0,0.5)]"
                            >
                              <Banknote className="w-10 h-10 text-emerald-400" />
                            </motion.div>
                            <div>
                              <h3 className="text-xl font-bold mb-2">Cash on Delivery</h3>
                              <p className="text-zinc-400 text-sm">Pay the driver directly when they arrive with your fuel.</p>
                            </div>

                            {/* Pricing */}
                            <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800 space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">Fuel Total</span>
                                <span className="font-semibold">Rs. {(activeBooking.total_price || activeBooking.total_amount || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-zinc-400">COD Service Fee</span>
                                <span className="font-semibold text-red-400">+ Rs. 30.00</span>
                              </div>
                              <div className="flex justify-between font-bold border-t border-zinc-700 pt-2 mt-2">
                                <span>Total (Pay to Driver)</span>
                                <span>Rs. {((activeBooking.total_price || activeBooking.total_amount || 0) + 30).toFixed(2)}</span>
                              </div>
                            </div>

                            <Button
                              className="w-full h-14 text-base font-black"
                              onClick={async () => {
                                setLoading(true);
                                try {
                                  // Just confirm the order â€” driver collects cash later
                                  await fetch(`/api/bookings/${activeBooking.id}/add-cod-fee`, { method: 'POST' });
                                } catch { }
                                setLoading(false);
                                setStep('tracking');
                              }}
                              loading={loading}
                            >
                              <DollarSign className="w-5 h-5" />
                              Confirm COD Order
                            </Button>
                          </Card>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            )}

            {step === 'tracking' && activeBooking && (
              <div className="space-y-6">
                <div className="relative h-80 rounded-3xl overflow-hidden border border-white/5 bg-zinc-900">
                  {/* Mock Map */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPinPulse />
                  </div>
                  <div className="absolute top-1/2 left-1/4">
                    <TruckMovement status={activeBooking.status} />
                  </div>
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mb-1">ETA</p>
                      <p className="text-xl font-bold text-red-500">12 MIN</p>
                    </div>
                    <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span className="text-xs font-bold uppercase tracking-widest">Live</span>
                    </div>
                  </div>
                </div>

                <div>
                  {loading ? (
                    <SkeletonLoader />
                  ) : (
                    <Card className="p-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-2xl bg-zinc-800 overflow-hidden">
                            <img src="https://i.pravatar.cc/150?u=driver" className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">Ahmed K.</p>
                            <div className="flex items-center gap-1 text-zinc-500 text-sm">
                              <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                              <span>4.9 (1.2k deliveries)</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-300"><Phone className="w-5 h-5" /></button>
                          <button className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-zinc-300"><MessageSquare className="w-5 h-5" /></button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-zinc-800">
                        <div className="flex items-center gap-3 text-zinc-400 text-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500" />
                          <span>Driver is on the way with your {activeBooking.fuel_type}</span>
                        </div>
                      </div>
                    </Card>
                  )}
                </div>

                <Button variant="secondary" className="w-full" onClick={() => setStep('home')}>Back to Home</Button>

                <div className="mt-8 pt-6 border-t border-white/5">
                  <PaymentFooter />
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold">Rescue History</h2>
            {history.length > 0 ? (
              <div className="space-y-4">
                {history.map(item => (
                  <Card key={item.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center">
                        <Fuel className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <p className="font-bold">{item.fuel_type} ({item.quantity}L)</p>
                        <p className="text-xs text-zinc-500">{new Date(item.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-red-500">Rs.{item.total_amount}</p>
                      <p className="text-[10px] uppercase font-bold text-emerald-500">{item.payment_status}</p>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-600">
                <History className="w-12 h-12 mb-4 opacity-20" />
                <p>No rescue history yet.</p>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'alerts' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold">System Alerts</h2>
            <div className="space-y-4">
              {alerts.map(alert => (
                <Card key={alert.id} className={cn("p-4 flex gap-4", alert.type === 'warning' ? "border-orange-500/20" : "border-blue-500/20")}>
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", alert.type === 'warning' ? "bg-orange-500/10 text-orange-500" : "bg-blue-500/10 text-blue-500")}>
                    {alert.type === 'warning' ? <AlertCircle className="w-5 h-5" /> : <Bell className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="font-bold">{alert.title}</p>
                    <p className="text-sm text-zinc-400">{alert.message}</p>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <h2 className="text-2xl font-bold">My Profile</h2>
            <Card className="flex items-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-2">
                <div className="bg-red-600/20 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Premium</div>
              </div>
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold border-2 border-red-600/20">
                {user.name[0]}
              </div>
              <div>
                <p className="text-xl font-bold">{user.name}</p>
                <p className="text-sm text-zinc-500">{user.email}</p>
              </div>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4 text-center space-y-1">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Rescues</p>
                <p className="text-2xl font-bold">{history.length}</p>
              </Card>
              <Card className="p-4 text-center space-y-1">
                <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Points</p>
                <p className="text-2xl font-bold">1,240</p>
              </Card>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Account Settings</label>
              <Button variant="outline" className="w-full justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                  <span>Payment Methods</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </Button>
              <Button variant="outline" className="w-full justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                  <span>Saved Addresses</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </Button>
              <Button variant="outline" className="w-full justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <CreditCard className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                  <span>My Vehicles</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </Button>

              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mt-6 mb-2">Support & Safety</label>
              <Button variant="outline" className="w-full justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <Shield className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                  <span>Safety Settings</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </Button>
              <Button variant="outline" className="w-full justify-between gap-3 group">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                  <span>Help Center</span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-600" />
              </Button>
              <Button variant="outline" className="w-full justify-start gap-3 mt-6 text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={onLogout}>
                <Settings className="w-4 h-4" /> Logout
              </Button>
            </div>
          </motion.div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-black/80 backdrop-blur-xl border-t border-white/5 px-8 py-4 flex justify-between items-center z-50">
        <button onClick={() => setActiveTab('explore')} className={cn("flex flex-col items-center gap-1", activeTab === 'explore' ? "text-red-500" : "text-zinc-500")}>
          <Navigation className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Explore</span>
        </button>
        <button onClick={() => setActiveTab('history')} className={cn("flex flex-col items-center gap-1", activeTab === 'history' ? "text-red-500" : "text-zinc-500")}>
          <History className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">History</span>
        </button>
        <button onClick={() => setActiveTab('alerts')} className={cn("flex flex-col items-center gap-1", activeTab === 'alerts' ? "text-red-500" : "text-zinc-500")}>
          <WiggleBadge count={alerts.length} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Alerts</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={cn("flex flex-col items-center gap-1", activeTab === 'profile' ? "text-red-500" : "text-zinc-500")}>
          <User className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Profile</span>
        </button>
      </nav>
    </div>
  );
}

function RescuePartnerApp({ user, onLogout }: any) {
  const [isOnline, setIsOnline] = useState(false);
  const [activeJob, setActiveJob] = useState<any>(null);
  const [tab, setTab] = useState<'tasks' | 'earnings' | 'profile'>('tasks');
  const [showCashAccepted, setShowCashAccepted] = useState(false);
  const [completing, setCompleting] = useState(false);
  const socket = useSocket(`driver_${user.id}`);

  useEffect(() => {
    if (socket) {
      socket.on('new_booking', (data) => {
        setActiveJob({ id: data.bookingId, status: 'assigned' });
      });
    }
  }, [socket]);

  const handleCompleteDelivery = async () => {
    setCompleting(true);
    try {
      await fetch('/api/payments/cod-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: activeJob.id, driverId: user.id })
      });
    } catch { }
    setCompleting(false);
    setShowCashAccepted(true);
  };

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-6 pb-24">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold">Rescue Partner</h1>
          <p className="text-xs text-zinc-500">ID: {user.id.slice(0, 8)}</p>
        </div>
        <button onClick={onLogout} className="p-2 bg-zinc-900 rounded-xl"><Settings className="w-5 h-5" /></button>
      </header>

      {tab === 'tasks' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 flex-1">
          <Card className="bg-gradient-to-br from-zinc-900 to-black border-white/5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-sm font-medium">Partner Status</p>
                <p className={cn("text-xl font-bold", isOnline ? "text-emerald-500" : "text-zinc-500")}>
                  {isOnline ? "Online & Ready" : "Offline"}
                </p>
              </div>
              <button
                onClick={() => setIsOnline(!isOnline)}
                className={cn(
                  "w-16 h-8 rounded-full relative transition-colors",
                  isOnline ? "bg-emerald-500" : "bg-zinc-800"
                )}
              >
                <div className={cn(
                  "absolute top-1 w-6 h-6 rounded-full bg-white transition-all",
                  isOnline ? "left-9" : "left-1"
                )} />
              </button>
            </div>
          </Card>

          <h2 className="text-lg font-bold">Active Rescue Task</h2>
          {activeJob ? (
            <Card className="border-red-600/50 bg-red-600/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center"><Fuel className="w-5 h-5" /></div>
                  <div>
                    <p className="font-bold">Emergency Fuel Request</p>
                    <p className="text-xs text-zinc-400">10L Special 95 â€¢ 2.4km away</p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <Button className="w-full">Navigate to Location</Button>
                <Button
                  variant="secondary"
                  className="w-full"
                  loading={completing}
                  onClick={handleCompleteDelivery}
                >
                  <DollarSign className="w-5 h-5" />
                  Cash Collected â€” Complete Delivery
                </Button>
              </div>
            </Card>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-3xl p-12 text-center min-h-[240px]">
              <AlertCircle className="w-12 h-12 mb-4 opacity-20" />
              <p>{isOnline ? "Waiting for requests..." : "Go online to start receiving jobs."}</p>
            </div>
          )}

          {/* Demo task for testing */}
          {isOnline && !activeJob && (
            <Card className="border-dashed border-zinc-700 bg-zinc-900/30">
              <p className="text-xs text-zinc-500 uppercase font-semibold tracking-widest mb-3">Demo â€” Simulate Incoming Job</p>
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => setActiveJob({ id: 'demo-order-001', status: 'assigned' })}
              >
                Simulate Incoming Rescue Request
              </Button>
            </Card>
          )}

          {showCashAccepted && (
            <CashAcceptedAnimation onComplete={() => { setShowCashAccepted(false); setActiveJob(null); }} />
          )}
        </motion.div>
      )}

      {tab === 'earnings' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">Today</p>
              <p className="text-2xl font-bold">Rs. 4,500</p>
            </Card>
            <Card className="p-4">
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-1">This Week</p>
              <p className="text-2xl font-bold">Rs. 28,400</p>
            </Card>
          </div>
          <Card className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5 font-bold">Recent Payouts</div>
            <div className="p-4 space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Payout #921{i}</p>
                    <p className="text-xs text-zinc-500">Feb 2{i}, 2026</p>
                  </div>
                  <p className="font-bold text-emerald-500">+Rs. 8,200</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {tab === 'profile' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <Card className="flex items-center gap-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
              <div className="bg-emerald-600/20 text-emerald-500 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest">Verified</div>
            </div>
            <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold border-2 border-emerald-600/20">
              {user.name[0]}
            </div>
            <div>
              <p className="text-xl font-bold">{user.name}</p>
              <p className="text-sm text-zinc-500">{user.email}</p>
            </div>
          </Card>

          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 text-center space-y-1">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Deliveries</p>
              <p className="text-xl font-bold">142</p>
            </Card>
            <Card className="p-3 text-center space-y-1">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Rating</p>
              <p className="text-xl font-bold">4.9</p>
            </Card>
            <Card className="p-3 text-center space-y-1">
              <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">Level</p>
              <p className="text-xl font-bold text-red-500">Gold</p>
            </Card>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Partner Settings</label>
            <Button variant="outline" className="w-full justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                <span>KYC Documents</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </Button>
            <Button variant="outline" className="w-full justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <CreditCard className="w-4 h-4 text-zinc-400 group-hover:text-red-500 transition-colors" />
                <span>Bank Account</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </Button>
            <Button variant="outline" className="w-full justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <Star className="w-4 h-4 text-zinc-400 group-hover:text-yellow-500 transition-colors" />
                <span>Ratings & Reviews</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </Button>
            <Button variant="outline" className="w-full justify-between gap-3 group">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-zinc-400 group-hover:text-blue-500 transition-colors" />
                <span>Working Hours</span>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-600" />
            </Button>

            <Button variant="outline" className="w-full justify-start gap-3 mt-6 text-red-500 border-red-500/20 hover:bg-red-500/10" onClick={onLogout}>
              <Settings className="w-4 h-4" /> Logout
            </Button>
          </div>
        </motion.div>
      )}

      {/* Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-xl border-t border-white/5 p-4 flex justify-around items-center max-w-md mx-auto">
        <button onClick={() => setTab('tasks')} className={cn("p-2 rounded-xl transition-colors", tab === 'tasks' ? "text-red-500 bg-red-500/10" : "text-zinc-500")}>
          <Navigation className="w-6 h-6" />
        </button>
        <button onClick={() => setTab('earnings')} className={cn("p-2 rounded-xl transition-colors", tab === 'earnings' ? "text-red-500 bg-red-500/10" : "text-zinc-500")}>
          <CreditCard className="w-6 h-6" />
        </button>
        <button onClick={() => setTab('profile')} className={cn("p-2 rounded-xl transition-colors", tab === 'profile' ? "text-red-500 bg-red-500/10" : "text-zinc-500")}>
          <User className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}

function AdminDashboard({ user, onLogout }: any) {
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'bookings' | 'partners' | 'dispatch'>('bookings');

  useEffect(() => {
    fetch('/api/admin/stats').then(r => r.json()).then(setStats);
    fetch('/api/admin/bookings').then(r => r.json()).then(setBookings);
    fetch('/api/admin/partners').then(r => r.json()).then(setPartners);
  }, []);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <header className="flex items-center justify-between mb-12">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">FuelresQ Admin</h1>
          <p className="text-zinc-500">India Operations Control Center â€¢ Bangalore</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-bold">{user.name}</p>
            <p className="text-xs text-zinc-500">Super Admin</p>
          </div>
          <button onClick={onLogout} className="p-3 bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors"><Settings className="w-6 h-6" /></button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <Card className="border-l-4 border-l-red-600">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Revenue</p>
          <p className="text-3xl font-bold">Rs. {stats?.totalRevenue?.toLocaleString('en-IN') || '0'}</p>
        </Card>
        <Card className="border-l-4 border-l-orange-500">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Active Requests</p>
          <p className="text-3xl font-bold">{stats?.activeBookings || 0}</p>
        </Card>
        <Card className="border-l-4 border-l-emerald-500">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Partners Online</p>
          <p className="text-3xl font-bold">{stats?.activeDrivers || 0}</p>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2">Total Bookings</p>
          <p className="text-3xl font-bold">{stats?.totalBookings || 0}</p>
        </Card>
      </div>

      <div className="flex gap-4 mb-8 border-b border-white/5">
        {(['bookings', 'partners', 'dispatch'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={cn(
              "pb-4 px-2 text-sm font-bold uppercase tracking-widest transition-all relative",
              activeTab === t ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {t}
            {activeTab === t && <motion.div layoutId="adminTab" className="absolute bottom-0 left-0 right-0 h-1 bg-red-600" />}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 p-0 overflow-hidden">
          {activeTab === 'bookings' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase text-zinc-500 border-b border-white/5">
                    <th className="px-6 py-4">Booking ID</th>
                    <th className="px-6 py-4">Fuel</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Payment</th>
                    <th className="px-6 py-4">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {bookings.map(b => (
                    <tr key={b.id} className="text-sm hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-mono text-xs text-zinc-400">{b.id.slice(0, 8)}...</p>
                      </td>
                      <td className="px-6 py-4">{b.fuel_type} ({b.quantity}L)</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          b.status === 'completed' ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500"
                        )}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          b.payment_status === 'completed' ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-500/20 text-zinc-500"
                        )}>
                          {b.payment_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold">Rs.{b.total_amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'partners' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs uppercase text-zinc-500 border-b border-white/5">
                    <th className="px-6 py-4">Partner ID</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Rating</th>
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {partners.map(p => (
                    <tr key={p.id} className="text-sm hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-zinc-400">{p.id.slice(0, 8)}...</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                          p.status === 'online' ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-500/20 text-zinc-500"
                        )}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{p.rating || '5.0'} â­</td>
                      <td className="px-6 py-4">
                        <button className="text-red-500 text-xs font-bold hover:underline">View Profile</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'dispatch' && (
            <div className="p-12 text-center">
              <Shield className="w-16 h-16 text-red-600 mx-auto mb-6 opacity-20" />
              <h3 className="text-xl font-bold mb-2">AI Smart Dispatch Active</h3>
              <p className="text-zinc-500 max-w-md mx-auto">The system is automatically assigning the nearest Rescue Partners to emergency requests based on traffic and inventory.</p>
            </div>
          )}
        </Card>

        <Card className="p-0 overflow-hidden">
          <div className="p-6 border-b border-white/5">
            <h3 className="font-bold">System Alerts</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-red-600/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-red-500">High Demand in Indiranagar</p>
                <p className="text-xs text-zinc-500 mt-1">Request volume is 40% higher than average. Dispatch priority increased.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/20 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-emerald-500">All Partners Certified</p>
                <p className="text-xs text-zinc-500 mt-1">Monthly safety audit completed for all active Bangalore partners.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

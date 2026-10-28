import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  CreditCard,
  CheckCircle,
  XCircle,
  FileText,
  Users,
  Activity,
  Award,
  Layers,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Menu,
  Sparkles,
  Shield,
  Briefcase,
  BookOpen,
  GraduationCap,
  ExternalLink,
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Smartphone,
  Copy,
  Wifi,
  WifiOff,
  MoreVertical,
  SlidersHorizontal,
  ArrowRight,
} from 'lucide-react';

const API_BASE = 'http://localhost:4000';

type StaffRole = 'SUPER_ADMINISTRATOR' | 'PAYMENT_ADMINISTRATOR' | 'REVIEWER' | 'CONTENT_EDITOR' | 'STUDENT';

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
}

interface StaffRoleConfig {
  label: string;
  shortLabel: string;
  badge: string;
  color: string;
  textColor: string;
  bgColor: string;
  borderColor: string;
  dotColor: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}

const DEMO_STAFF: Record<StaffRole, StaffUser> = {
  SUPER_ADMINISTRATOR: {
    id: 'usr-admin-01',
    fullName: 'Dr. Abebe Bekele',
    email: 'admin@exitprep.et',
    role: 'SUPER_ADMINISTRATOR',
  },
  PAYMENT_ADMINISTRATOR: {
    id: 'usr-fin-02',
    fullName: 'Tigist Haile',
    email: 'finance@exitprep.et',
    role: 'PAYMENT_ADMINISTRATOR',
  },
  REVIEWER: {
    id: 'usr-rev-03',
    fullName: 'Dr. Dawit Tadesse',
    email: 'reviewer@exitprep.et',
    role: 'REVIEWER',
  },
  CONTENT_EDITOR: {
    id: 'usr-edit-04',
    fullName: 'Selamawit Girma',
    email: 'editor@exitprep.et',
    role: 'CONTENT_EDITOR',
  },
  STUDENT: {
    id: 'usr-stud-05',
    fullName: 'Kidus Yohannes',
    email: 'student@exitprep.et',
    role: 'STUDENT',
  },
};

const ROLE_CONFIGS: Record<StaffRole, StaffRoleConfig> = {
  SUPER_ADMINISTRATOR: {
    label: 'Super Administrator',
    shortLabel: 'Super Admin',
    badge: 'Executive',
    color: 'emerald',
    textColor: 'text-emerald-400',
    bgColor: 'bg-emerald-500/10 hover:bg-emerald-500/20',
    borderColor: 'border-emerald-500/30',
    dotColor: 'bg-emerald-400',
    desc: 'Full system authorization, user management & security audit trail',
    icon: Shield,
  },
  PAYMENT_ADMINISTRATOR: {
    label: 'Payment Officer (Finance)',
    shortLabel: 'Finance',
    badge: 'Finance',
    color: 'blue',
    textColor: 'text-blue-400',
    bgColor: 'bg-blue-500/10 hover:bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    dotColor: 'bg-blue-400',
    desc: 'Verify CBE & Telebirr transaction slips & activate subscriptions',
    icon: CreditCard,
  },
  REVIEWER: {
    label: 'Academic Reviewer',
    shortLabel: 'Reviewer',
    badge: 'Academic',
    color: 'amber',
    textColor: 'text-amber-400',
    bgColor: 'bg-amber-500/10 hover:bg-amber-500/20',
    borderColor: 'border-amber-500/30',
    dotColor: 'bg-amber-400',
    desc: 'Review submitted questions against MoE blueprints & verify citations',
    icon: BookOpen,
  },
  CONTENT_EDITOR: {
    label: 'Content Editor',
    shortLabel: 'Editor',
    badge: 'Curriculum',
    color: 'purple',
    textColor: 'text-purple-400',
    bgColor: 'bg-purple-500/10 hover:bg-purple-500/20',
    borderColor: 'border-purple-500/30',
    dotColor: 'bg-purple-400',
    desc: 'Draft questions & link items to university business departments',
    icon: FileText,
  },
  STUDENT: {
    label: 'Student View',
    shortLabel: 'Student',
    badge: 'Restricted',
    color: 'rose',
    textColor: 'text-rose-400',
    bgColor: 'bg-rose-500/10 hover:bg-rose-500/20',
    borderColor: 'border-rose-500/30',
    dotColor: 'bg-rose-400',
    desc: 'Access control test view (evaluates 403 authorization guard)',
    icon: GraduationCap,
  },
};

interface PaymentReceipt {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  bankName: string;
  transactionRef: string;
  amountETB: number;
  status: 'SUBMITTED' | 'VERIFIED' | 'REJECTED';
  adminNotes?: string;
  createdAt: string;
}

interface Question {
  id: string;
  stem: string;
  programName?: string;
  difficulty: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  referenceSource?: string;
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentRole, setCurrentRole] = useState<StaffRole>('SUPER_ADMINISTRATOR');
  const [activeSection, setActiveSection] = useState<'overview' | 'payments' | 'questions' | 'catalog' | 'users' | 'audit'>('overview');
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [isApiOnline, setIsApiOnline] = useState<boolean | null>(null);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  // Admin login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Copy feedback state for mobile receipt verification
  const [copiedRef, setCopiedRef] = useState<string | null>(null);

  // Search & filter states
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED'>('ALL');
  const [paymentSearch, setPaymentSearch] = useState('');
  const [questionSearch, setQuestionSearch] = useState('');

  // Stats
  const [stats, setStats] = useState({
    totalStudents: 142,
    pendingPayments: 2,
    pendingQuestions: 1,
    verifiedQuestions: 124,
    activeSubscriptions: 89,
  });

  // Payments queue
  const [payments, setPayments] = useState<PaymentReceipt[]>([
    {
      id: 'rcpt-01',
      userId: 'usr-stud-05',
      userName: 'Kidus Yohannes',
      userEmail: 'student@exitprep.et',
      bankName: 'TELEBIRR',
      transactionRef: 'FT26298ABCD1234',
      amountETB: 150.0,
      status: 'SUBMITTED',
      createdAt: '2026-10-27T17:30:00Z',
    },
    {
      id: 'rcpt-02',
      userId: 'usr-stud-09',
      userName: 'Bethlehem Tsegaye',
      userEmail: 'bethlehem@gmail.com',
      bankName: 'CBE',
      transactionRef: 'CBE98472910482',
      amountETB: 350.0,
      status: 'SUBMITTED',
      createdAt: '2026-10-27T18:15:00Z',
    },
  ]);

  // Questions bank
  const [questions, setQuestions] = useState<Question[]>([
    {
      id: 'q-sample-acc-01',
      stem: 'Which of the following forms of audit evidence is generally considered the most reliable by an independent auditor?',
      programName: 'Accounting and Finance',
      difficulty: 'INTERMEDIATE',
      status: 'VERIFIED',
      referenceSource: 'Higher Education Exit Exam Blueprint / ISA 500',
    },
    {
      id: 'q-sample-acc-02',
      stem: 'Under Ethiopian Tax Law (Federal Income Tax Proclamation No. 979/2016), which of the following is designated as Category "A"?',
      programName: 'Accounting and Finance',
      difficulty: 'INTERMEDIATE',
      status: 'VERIFIED',
      referenceSource: 'Federal Income Tax Proclamation No. 979/2016, Art. 18',
    },
    {
      id: 'q-sample-draft-03',
      stem: 'In capital budgeting, the Internal Rate of Return (IRR) is defined as the discount rate that equates Net Present Value (NPV) to zero.',
      programName: 'Accounting and Finance',
      difficulty: 'BEGINNER',
      status: 'PENDING_REVIEW',
      referenceSource: 'Financial Management / Corporate Finance Syllabus',
    },
  ]);

  // Check persistent session on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Close top role dropdown when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRoleDropdownOpen(false);
      }
    };
    if (roleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [roleDropdownOpen]);

  const checkAuth = async () => {
    setAuthChecking(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/me`, {
        credentials: 'include',
      });
      setIsApiOnline(true);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.role === 'STUDENT') {
            setLoginError('Access Denied: Student accounts do not have staff administrator privileges.');
            setCurrentUser(null);
          } else {
            setCurrentUser(json.data);
            setCurrentRole(json.data.role as StaffRole);
            fetchStats();
          }
        }
      }
    } catch {
      // API offline on port 4000
      setIsApiOnline(false);
    } finally {
      setAuthChecking(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          identifier: loginEmail.trim(),
          password: loginPassword,
        }),
      });

      setIsApiOnline(true);
      const json = await res.json();
      if (json.success && json.data?.user) {
        const u = json.data.user;
        if (u.role === 'STUDENT') {
          setLoginError('Access Denied: Student accounts do not have staff administrator privileges.');
          await fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
          return;
        }
        setCurrentUser(u);
        setCurrentRole(u.role as StaffRole);
        fetchStats();
      } else {
        setLoginError(json.error?.message || 'Login failed. Please check credentials.');
      }
    } catch {
      // Local fallback for offline testing
      setIsApiOnline(false);
      const matching = Object.values(DEMO_STAFF).find(
        (s) => s.email.toLowerCase() === loginEmail.trim().toLowerCase()
      );
      if (matching) {
        if (matching.role === 'STUDENT') {
          setLoginError('Access Denied: Student accounts cannot access the Staff Administration Console.');
        } else {
          setCurrentUser(matching);
          setCurrentRole(matching.role);
        }
      } else {
        // Allow user-friendly offline test login with any demo role if requested
        const fallback = DEMO_STAFF.SUPER_ADMINISTRATOR;
        setCurrentUser({
          ...fallback,
          email: loginEmail.trim() || fallback.email,
        });
        setCurrentRole('SUPER_ADMINISTRATOR');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    try {
      await fetch(`${API_BASE}/api/v1/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // offline
    }
    setCurrentUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setLoginError(null);
    setMobileDrawerOpen(false);
  };

  const loginAsDemoStaff = async (roleKey: StaffRole) => {
    const staff = DEMO_STAFF[roleKey];
    setLoginEmail(staff.email);
    const pwd = roleKey === 'SUPER_ADMINISTRATOR' ? 'Admin@ExitPrep2026!' : 'ExitPrep@2026!';
    setLoginPassword(pwd);
    setLoginError(null);
    setLoginLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: staff.email,
          password: pwd,
        }),
      });
      const json = await res.json();
      if (json.success && json.data?.user) {
        const u = json.data.user;
        if (u.role === 'STUDENT') {
          setLoginError('Access Denied: Student accounts do not have staff administrator privileges.');
          await fetch(`${API_BASE}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
          return;
        }
        setIsApiOnline(true);
        setCurrentUser(u);
        setCurrentRole(u.role as StaffRole);
        fetchStats();
        return;
      } else {
        setLoginError(json.error?.message || 'Authentication rejected');
      }
    } catch {
      // offline fallback
      setIsApiOnline(false);
      if (roleKey === 'STUDENT') {
        setLoginError('Access Denied: Student accounts do not have staff administrator privileges.');
      } else {
        setCurrentUser(staff);
        setCurrentRole(roleKey);
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/dashboard`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (json.success && json.data?.stats) {
        setStats(json.data.stats);
        setIsApiOnline(true);
      }
    } catch {
      // Dev mode local state
    }
  };

  const handleVerifyPayment = (id: string, action: 'APPROVE' | 'REJECT') => {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
            adminNotes: action === 'APPROVE' ? 'Approved against CBE/Telebirr statement' : 'Reference mismatch',
          };
        }
        return p;
      })
    );
  };

  const handleReviewQuestion = (id: string, action: 'APPROVE' | 'REJECT') => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.id === id) {
          return {
            ...q,
            status: action === 'APPROVE' ? 'VERIFIED' : 'REJECTED',
          };
        }
        return q;
      })
    );
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedRef(text);
    setTimeout(() => {
      setCopiedRef((cur) => (cur === text ? null : cur));
    }, 2000);
  };

  const isRoleAllowed = (allowed: StaffRole[]) => allowed.includes(currentRole);

  const pendingPaymentsCount = payments.filter((p) => p.status === 'SUBMITTED').length;
  const pendingQuestionsCount = questions.filter((q) => q.status === 'PENDING_REVIEW').length;
  const currentRoleConfig = ROLE_CONFIGS[currentRole];
  const CurrentRoleIcon = currentRoleConfig.icon;

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = paymentFilter === 'ALL' || p.status === paymentFilter;
    const matchesSearch =
      paymentSearch.trim() === '' ||
      p.userName?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.userEmail?.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.transactionRef.toLowerCase().includes(paymentSearch.toLowerCase()) ||
      p.bankName.toLowerCase().includes(paymentSearch.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredQuestions = questions.filter((q) => {
    return (
      questionSearch.trim() === '' ||
      q.stem.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.programName?.toLowerCase().includes(questionSearch.toLowerCase()) ||
      q.referenceSource?.toLowerCase().includes(questionSearch.toLowerCase())
    );
  });

  // Loading Screen
  if (authChecking) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 shadow-lg shadow-emerald-950/60 animate-pulse">
          <Shield className="w-6 h-6" />
        </div>
        <p className="text-xs text-slate-400 font-medium">Verifying staff credentials & session security...</p>
      </div>
    );
  }

  // Login Screen
  if (!currentUser) {
    return (
      <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-3 sm:p-6 font-sans">
        <div className="w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden relative backdrop-blur-md">
          {/* Top Emerald Gradient Line */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600"></div>

          {/* Backend Connection Status Banner */}
          {isApiOnline === false && (
            <div className="bg-amber-950/80 border-b border-amber-800/80 px-4 py-2 text-[11px] text-amber-300 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Backend offline (:4000) • <strong>Dev Demo Mode Active</strong></span>
              </div>
              <button
                type="button"
                onClick={() => checkAuth()}
                className="text-[10px] uppercase font-bold text-amber-400 hover:text-amber-200 underline cursor-pointer shrink-0"
              >
                Retry
              </button>
            </div>
          )}

          {/* Header */}
          <div className="text-center pt-6 px-4 sm:px-7 pb-2">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 text-white flex items-center justify-center mx-auto mb-2.5 shadow-lg shadow-emerald-950/60 ring-4 ring-emerald-500/10">
              <Shield className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] sm:text-[11px] font-black uppercase tracking-wider mb-1.5">
              <span>ExitPrep Ethiopia 🇪🇹</span>
            </div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              Staff Operations Portal
            </h1>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              Restricted to authorized Ministry reviewers, department editors & payment officers.
            </p>
          </div>

          {/* Error Alert */}
          {loginError && (
            <div className="mx-4 sm:mx-7 mt-2 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{loginError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleAdminLogin} className="p-4 sm:p-7 pt-3 space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Staff Email or Phone</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder="admin@exitprep.et or +2519..."
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950/80 focus:bg-slate-950 text-white placeholder:text-slate-500 text-sm sm:text-xs rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all outline-hidden min-h-[44px]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300">Staff Password</label>
                <span className="text-[10px] text-slate-500 font-medium">
                  {showPassword ? 'Visible' : 'Hidden'}
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-2.5 bg-slate-950/80 focus:bg-slate-950 text-white placeholder:text-slate-500 text-sm sm:text-xs rounded-xl border border-slate-700/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 font-mono transition-all outline-hidden min-h-[44px]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors p-2 min-h-[44px] min-w-[44px] justify-center"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-emerald-400" /> : <Eye className="w-4 h-4 text-slate-500" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 transition-all active:scale-[0.99] flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-50 cursor-pointer"
            >
              {loginLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Sign In to Staff Console</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Access Dev Testing Buttons */}
          <div className="p-4 sm:p-7 pt-0 border-t border-slate-800/80 mt-1">
            <div className="flex items-center justify-between pt-3 mb-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                ⚡ Quick Dev Login (Seeded Roles):
              </p>
              {isApiOnline === false && (
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 font-mono">
                  Offline Instant
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginAsDemoStaff('SUPER_ADMINISTRATOR')}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all text-[11px] cursor-pointer min-h-[44px] flex flex-col justify-center active:scale-[0.98]"
              >
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Super Admin</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Dr. Abebe Bekele</div>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoStaff('PAYMENT_ADMINISTRATOR')}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all text-[11px] cursor-pointer min-h-[44px] flex flex-col justify-center active:scale-[0.98]"
              >
                <div className="font-bold text-blue-400 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Finance Officer</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Tigist Haile</div>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoStaff('REVIEWER')}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all text-[11px] cursor-pointer min-h-[44px] flex flex-col justify-center active:scale-[0.98]"
              >
                <div className="font-bold text-amber-400 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Reviewer</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Dr. Dawit Tadesse</div>
              </button>

              <button
                type="button"
                onClick={() => loginAsDemoStaff('CONTENT_EDITOR')}
                className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700 text-left transition-all text-[11px] cursor-pointer min-h-[44px] flex flex-col justify-center active:scale-[0.98]"
              >
                <div className="font-bold text-purple-400 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Content Editor</span>
                </div>
                <div className="text-[10px] text-slate-400 truncate">Selamawit Girma</div>
              </button>
            </div>

            {/* Test Student Rejection Guard */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => loginAsDemoStaff('STUDENT')}
                className="w-full p-2.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/50 text-rose-300 text-left transition-all text-[11px] flex items-center justify-between cursor-pointer min-h-[44px] active:scale-[0.98]"
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-rose-400 shrink-0" />
                  <div>
                    <span className="font-bold text-rose-300">Test Student Access Guard</span>
                    <span className="block text-[10px] text-rose-400/80">Attempts login as student@exitprep.et</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 shrink-0">
                  Expect 403
                </span>
              </button>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-500 mt-4 text-center px-4">
          ExitPrep Ethiopia • Academic and COC Examination Security Framework
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sleek Ultra-Compact Security Header Line */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 px-3 sm:px-4 py-1 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate text-slate-300 font-medium">ExitPrep Operations Console</span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">Restricted to authorized personnel</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {isApiOnline === false ? (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/90 text-amber-300 border border-amber-800/70 flex items-center gap-1">
                <WifiOff className="w-3 h-3 text-amber-400" />
                <span>DEMO MODE</span>
              </span>
            ) : (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-emerald-400 border border-slate-700/60 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>API :4000</span>
              </span>
            )}
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-amber-300/90 border border-slate-700/60 hidden sm:inline">
              PORT 5174
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Header */}
      <header className="sticky top-0 z-30 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20 overflow-visible">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Brand Identity */}
          <div
            className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none min-w-0 shrink-0"
            onClick={() => {
              setActiveSection('overview');
              setMobileDrawerOpen(false);
            }}
          >
            {/* Logo Badge */}
            <div className="relative shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/30">
                EP
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500"></span>
              </span>
            </div>

            {/* Title & Ethiopian Flag */}
            <div className="min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">ExitPrep</span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 shrink-0">
                  ADMIN 🇪🇹
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden sm:block -mt-0.5">
                Staff Operations Portal
              </p>
            </div>
          </div>

          {/* Right: Top Dropdown Role Switcher, Hamburger Drawer Toggle & Sign Out */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Top Dropdown: Switch Staff Role */}
            <div className="relative shrink-0" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleDropdownOpen((prev) => !prev)}
                aria-expanded={roleDropdownOpen}
                aria-haspopup="listbox"
                aria-label="Switch staff role dropdown"
                className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-150 active:scale-95 text-xs font-semibold min-h-[38px] cursor-pointer shadow-sm ${
                  roleDropdownOpen
                    ? 'ring-2 ring-emerald-500/40 bg-slate-800 border-emerald-500/50'
                    : `${currentRoleConfig.bgColor} ${currentRoleConfig.borderColor}`
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${currentRoleConfig.dotColor} animate-pulse shrink-0`}></span>
                  <CurrentRoleIcon className={`w-3.5 h-3.5 ${currentRoleConfig.textColor} shrink-0`} />
                  <span className="text-[11px] text-slate-400 font-normal hidden sm:inline">Role:</span>
                  <span className={`font-bold ${currentRoleConfig.textColor} text-xs truncate max-w-[85px] sm:max-w-none`}>
                    {currentRoleConfig.shortLabel}
                  </span>
                </div>

                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-300 font-mono hidden md:inline">
                  {(currentUser?.fullName || DEMO_STAFF[currentRole].fullName).split(' ')[0]}
                </span>

                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${
                    roleDropdownOpen ? 'rotate-180 text-white' : ''
                  }`}
                />
              </button>

              {/* Floating Top Dropdown Menu */}
              {roleDropdownOpen && (
                <>
                  {/* Backdrop Overlay to prevent content bleed-through & visual overlap */}
                  <div
                    className="fixed inset-0 z-40 bg-slate-950/75 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
                    onClick={() => setRoleDropdownOpen(false)}
                    aria-hidden="true"
                  />

                  {/* Fully Opaque, High-Contrast Dropdown Card */}
                  <div
                    role="listbox"
                    aria-label="Staff Roles"
                    className="fixed inset-x-3 top-16 sm:inset-x-auto sm:absolute sm:right-0 sm:top-full sm:mt-2 w-auto sm:w-96 max-w-md bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-2xl p-3 z-50 ring-1 ring-emerald-500/30 animate-in fade-in zoom-in-95 sm:slide-in-from-top-2 duration-150"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between px-2.5 py-2 mb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm font-bold text-white">Switch Staff Role</div>
                          <div className="text-[10px] text-slate-400">Select active permission level</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                        Active: {currentRoleConfig.shortLabel}
                      </span>
                    </div>

                    {/* Role Items */}
                    <div className="space-y-2 max-h-[60dvh] overflow-y-auto pr-0.5">
                      {(Object.keys(DEMO_STAFF) as StaffRole[]).map((roleKey) => {
                        const conf = ROLE_CONFIGS[roleKey];
                        const staff = DEMO_STAFF[roleKey];
                        const isSelected = currentRole === roleKey;
                        const IconComponent = conf.icon;

                        return (
                          <button
                            key={roleKey}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => {
                              loginAsDemoStaff(roleKey);
                              setRoleDropdownOpen(false);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer active:scale-[0.99] min-h-[52px] ${
                              isSelected
                                ? 'bg-slate-950 border-emerald-500/60 ring-2 ring-emerald-500/30 shadow-md'
                                : 'bg-slate-950/95 border-slate-800 hover:bg-slate-800 hover:border-slate-700 text-slate-200'
                            }`}
                          >
                            <div
                              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${conf.bgColor} border ${conf.borderColor}`}
                            >
                              <IconComponent className={`w-4 h-4 ${conf.textColor}`} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1 mb-0.5">
                                <span
                                  className={`font-bold text-xs sm:text-sm truncate ${
                                    isSelected ? 'text-white' : 'text-slate-200'
                                  }`}
                                >
                                  {conf.label}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${conf.borderColor} ${conf.textColor} shrink-0`}
                                >
                                  {conf.badge}
                                </span>
                              </div>

                              <div className="text-[11px] text-slate-300 font-medium truncate mb-1">
                                {staff.fullName} • <span className="font-mono text-slate-400">{staff.email}</span>
                              </div>

                              <p className="text-[11px] text-slate-400 leading-snug">
                                {conf.desc}
                              </p>
                            </div>

                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Dropdown Footer */}
                    <div className="mt-2.5 pt-2 border-t border-slate-800 px-2 flex items-center justify-between text-[11px] text-slate-400">
                      <span>RBAC Security Enforced</span>
                      <button
                        type="button"
                        onClick={() => setRoleDropdownOpen(false)}
                        className="text-emerald-400 hover:text-emerald-300 font-bold cursor-pointer p-1"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleAdminLogout}
              aria-label="Sign out of operations console"
              title="Sign out of operations console"
              className="hidden sm:flex p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 rounded-xl transition-all cursor-pointer min-h-[38px] min-w-[38px] items-center justify-center active:scale-95 shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Sidebar Button List (Most Right) */}
            <button
              onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
              aria-label="Open sidebar operations menu"
              title="Open operations menu"
              className="p-2 text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center relative active:scale-95 shrink-0"
            >
              <Menu className="w-5 h-5 text-slate-200" />
              {(pendingPaymentsCount > 0 || pendingQuestionsCount > 0) && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full ring-2 ring-slate-900"></span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Slide-Over Drawer Menu (Anchored to the Most Right with "X" Close Button Inside) */}
      {mobileDrawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex justify-end animate-in fade-in duration-150"
          onClick={() => setMobileDrawerOpen(false)}
        >
          <div
            className="w-full max-w-xs sm:max-w-sm bg-slate-900 border-l border-slate-800 h-full p-4 flex flex-col justify-between shadow-2xl relative animate-in slide-in-from-right duration-200 overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Header with Title and "X" Close Button Inside */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm">Navigation Menu</h3>
                    <p className="text-[10px] text-slate-400">ExitPrep Operations Console</p>
                  </div>
                </div>

                {/* "X" Button Inside the Sidebar */}
                <button
                  type="button"
                  onClick={() => setMobileDrawerOpen(false)}
                  aria-label="Close sidebar menu"
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center cursor-pointer active:scale-95"
                >
                  <X className="w-5 h-5 text-slate-200" />
                </button>
              </div>

              {/* Drawer User Profile Card */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-4">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${currentRoleConfig.bgColor} border ${currentRoleConfig.borderColor}`}>
                    <CurrentRoleIcon className={`w-5 h-5 ${currentRoleConfig.textColor}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-white text-xs truncate">
                      {currentUser?.fullName || DEMO_STAFF[currentRole].fullName}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {currentUser?.email || DEMO_STAFF[currentRole].email}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider ${currentRoleConfig.bgColor} ${currentRoleConfig.textColor} border ${currentRoleConfig.borderColor}`}>
                    {currentRoleConfig.label}
                  </span>
                  <button
                    onClick={() => {
                      setMobileDrawerOpen(false);
                      setRoleDropdownOpen(true);
                    }}
                    className="text-emerald-400 font-bold hover:underline"
                  >
                    Switch Role
                  </button>
                </div>
              </div>

              {/* Navigation Links */}
              <div className="space-y-1 text-xs">
                <button
                  onClick={() => {
                    setActiveSection('overview');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors min-h-[44px] ${
                    activeSection === 'overview'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <span>Dashboard Overview</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => {
                    setActiveSection('payments');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors min-h-[44px] ${
                    activeSection === 'payments'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <CreditCard className="w-4 h-4 text-blue-400" />
                    <span>Payment Verification</span>
                  </div>
                  {pendingPaymentsCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      {pendingPaymentsCount}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveSection('questions');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors min-h-[44px] ${
                    activeSection === 'questions'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-amber-400" />
                    <span>Question Bank & Review</span>
                  </div>
                  {pendingQuestionsCount > 0 ? (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-slate-950">
                      {pendingQuestionsCount}
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveSection('catalog');
                    setMobileDrawerOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors min-h-[44px] ${
                    activeSection === 'catalog'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Program & COC Catalog</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                {isRoleAllowed(['SUPER_ADMINISTRATOR']) && (
                  <>
                    <button
                      onClick={() => {
                        setActiveSection('users');
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors min-h-[44px] ${
                        activeSection === 'users'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Users className="w-4 h-4 text-teal-400" />
                        <span>User & Role Management</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>

                    <button
                      onClick={() => {
                        setActiveSection('audit');
                        setMobileDrawerOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-semibold transition-colors min-h-[44px] ${
                        activeSection === 'audit'
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>Security Audit Logs</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Bottom Actions in Drawer */}
            <div className="pt-4 border-t border-slate-800 space-y-2">
              <div className="text-[10px] text-slate-400 px-2 flex items-center justify-between">
                <span>ExitPrep Operations</span>
                <span className="font-mono text-emerald-400">v1.0.0</span>
              </div>
              <button
                onClick={handleAdminLogout}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/60 text-rose-300 font-bold text-xs min-h-[44px] transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out of Console</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Body */}
      {currentRole === 'STUDENT' ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md text-center shadow-xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-2">Access Denied (Role: STUDENT)</h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Students do not have permission to view or modify question banks, administrative audit logs, or payment
              verifications. Please switch to an administrative role in the top header.
            </p>
            <button
              onClick={() => setCurrentRole('SUPER_ADMINISTRATOR')}
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs min-h-[44px] transition-all active:scale-95 shadow-md shadow-emerald-950 cursor-pointer"
            >
              Switch to Super Administrator
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-3 sm:py-6 flex flex-col lg:grid lg:grid-cols-5 gap-4 sm:gap-6 pb-24 lg:pb-6">
          {/* Mobile Horizontal Quick-Scroll Tabs */}
          <div
            tabIndex={0}
            role="region"
            aria-label="Staff operations navigation sections"
            className="lg:hidden flex overflow-x-auto no-scrollbar gap-1.5 pb-1 border-b border-slate-800 text-xs"
          >
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-all active:scale-95 ${
                activeSection === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveSection('payments')}
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-all active:scale-95 ${
                activeSection === 'payments'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments</span>
              {pendingPaymentsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                  {pendingPaymentsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('questions')}
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-all active:scale-95 ${
                activeSection === 'questions'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Questions</span>
              {pendingQuestionsCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950">
                  {pendingQuestionsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSection('catalog')}
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-all active:scale-95 ${
                activeSection === 'catalog'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>

            {isRoleAllowed(['SUPER_ADMINISTRATOR']) && (
              <>
                <button
                  onClick={() => setActiveSection('users')}
                  className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-all active:scale-95 ${
                    activeSection === 'users'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users</span>
                </button>

                <button
                  onClick={() => setActiveSection('audit')}
                  className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-all active:scale-95 ${
                    activeSection === 'audit'
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                      : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800/80'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Audit</span>
                </button>
              </>
            )}
          </div>

          {/* Desktop Left Sidebar Menu */}
          <div className="hidden lg:block lg:col-span-1 space-y-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer ${
                activeSection === 'overview'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveSection('payments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer ${
                activeSection === 'payments'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-blue-400 shrink-0" />
                <span>Payment Verification</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                {pendingPaymentsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('questions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer ${
                activeSection === 'questions'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Question Bank & Review</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                {pendingQuestionsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('catalog')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer ${
                activeSection === 'catalog'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Program & COC Catalog</span>
            </button>

            {isRoleAllowed(['SUPER_ADMINISTRATOR']) && (
              <>
                <button
                  onClick={() => setActiveSection('users')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer ${
                    activeSection === 'users'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-teal-400 shrink-0" />
                  <span>User & Role Management</span>
                </button>

                <button
                  onClick={() => setActiveSection('audit')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] cursor-pointer ${
                    activeSection === 'audit'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>Security Audit Logs</span>
                </button>
              </>
            )}

            {/* Quick System Status Card in Sidebar */}
            <div className="pt-4 mt-4 border-t border-slate-800">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-1.5">
                <div className="font-bold text-slate-300 flex items-center justify-between">
                  <span>System Status</span>
                  <span className={`w-2 h-2 rounded-full ${isApiOnline === false ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
                </div>
                <div className="text-slate-400 text-[10px] flex items-center justify-between">
                  <span>Backend API:</span>
                  <span className={isApiOnline === false ? 'text-amber-400 font-mono' : 'text-emerald-400 font-mono'}>
                    {isApiOnline === false ? 'Offline (Demo)' : 'Port 4000'}
                  </span>
                </div>
                <div className="text-slate-400 text-[10px] flex items-center justify-between">
                  <span>Active Role:</span>
                  <span className="text-slate-300 font-semibold">{currentRoleConfig.shortLabel}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Area */}
          <div className="lg:col-span-4 min-w-0">
            {/* Overview */}
            {activeSection === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Administrative Dashboard</h1>
                    <p className="text-xs text-slate-400">
                      ExitPrep Ethiopia operational overview: active students, question reviews, and pending payment slips.
                    </p>
                  </div>
                  {isApiOnline === false && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/60 border border-amber-800/80 text-[11px] text-amber-300 self-start sm:self-auto">
                      <WifiOff className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Demo Mode Active (API offline on :4000)</span>
                    </div>
                  )}
                </div>

                {/* Metrics with centered icons */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
                  <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 text-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Enrolled Students</span>
                    <span className="text-lg sm:text-2xl font-extrabold text-white">{stats.totalStudents}</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">+12 this week</span>
                  </div>

                  <div
                    onClick={() => setActiveSection('payments')}
                    className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 text-center cursor-pointer hover:border-amber-500/40 transition-colors active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Pending Slips</span>
                    <span className="text-lg sm:text-2xl font-extrabold text-amber-400">{pendingPaymentsCount}</span>
                    <span className="text-[10px] text-amber-300 block mt-1">Tap to review →</span>
                  </div>

                  <div
                    onClick={() => setActiveSection('questions')}
                    className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 text-center cursor-pointer hover:border-blue-500/40 transition-colors active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Under Review</span>
                    <span className="text-lg sm:text-2xl font-extrabold text-blue-400">{pendingQuestionsCount}</span>
                    <span className="text-[10px] text-blue-300 block mt-1">Tap to review →</span>
                  </div>

                  <div className="bg-slate-900 p-3 sm:p-4 rounded-xl border border-slate-800 text-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Subscriptions</span>
                    <span className="text-lg sm:text-2xl font-extrabold text-emerald-400">{stats.activeSubscriptions}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Paid standard/prem</span>
                  </div>
                </div>

                {/* Mobile Quick Action Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div
                    onClick={() => setActiveSection('payments')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/50 flex items-center justify-between gap-3 cursor-pointer hover:border-blue-700/60 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm">Payment Verification Queue</div>
                        <div className="text-[11px] text-slate-400">
                          {pendingPaymentsCount} slip{pendingPaymentsCount !== 1 ? 's' : ''} awaiting CBE/Telebirr check
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
                  </div>

                  <div
                    onClick={() => setActiveSection('questions')}
                    className="p-4 rounded-2xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-900/50 flex items-center justify-between gap-3 cursor-pointer hover:border-amber-700/60 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-white text-xs sm:text-sm">Question Bank Sign-Off</div>
                        <div className="text-[11px] text-slate-400">
                          {pendingQuestionsCount} item{pendingQuestionsCount !== 1 ? 's' : ''} pending MoE blueprint review
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-amber-400 shrink-0" />
                  </div>
                </div>

                {/* Content Policy Alert */}
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1 text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Content Integrity Policy Active</span>
                  </div>
                  <p className="text-emerald-300/80 leading-relaxed text-xs">
                    ExitPrep Ethiopia strictly forbids publishing unofficial curricula or invented questions. All questions
                    must cite recognized higher education benchmarks (e.g. ISA, Ethiopian Proclamations, MoE syllabi)
                    prior to publication.
                  </p>
                </div>
              </div>
            )}

            {/* Payments Verification Section */}
            {activeSection === 'payments' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Payment Verification Queue</h1>
                    <p className="text-xs text-slate-400">
                      Verify student bank deposit slips and activate premium semester subscriptions.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchStats()}
                    className="self-start sm:self-auto p-2 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-slate-300 text-xs flex items-center gap-1.5 min-h-[40px] border border-slate-800 active:scale-95 transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh Queue</span>
                  </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="flex flex-col sm:flex-row gap-2 sm:items-center justify-between">
                  {/* Status Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 sm:pb-0 text-xs">
                    {(['ALL', 'SUBMITTED', 'VERIFIED', 'REJECTED'] as const).map((statusKey) => (
                      <button
                        key={statusKey}
                        onClick={() => setPaymentFilter(statusKey)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-[11px] shrink-0 transition-colors min-h-[36px] ${
                          paymentFilter === statusKey
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {statusKey === 'ALL'
                          ? `All (${payments.length})`
                          : statusKey === 'SUBMITTED'
                          ? `Pending (${pendingPaymentsCount})`
                          : statusKey === 'VERIFIED'
                          ? 'Verified'
                          : 'Rejected'}
                      </button>
                    ))}
                  </div>

                  {/* Search Input */}
                  <div className="relative min-w-[200px] sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search ref, student, bank..."
                      value={paymentSearch}
                      onChange={(e) => setPaymentSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden min-h-[38px]"
                    />
                  </div>
                </div>

                {/* Mobile Cards for Payments */}
                <div className="space-y-3 md:hidden">
                  {filteredPayments.length === 0 ? (
                    <div className="p-8 text-center bg-slate-900 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                      No payments found matching the selected filter.
                    </div>
                  ) : (
                    filteredPayments.map((p) => (
                      <div key={p.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white text-sm truncate">{p.userName}</div>
                            <div className="text-[11px] text-slate-400 truncate">{p.userEmail}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                            p.bankName === 'TELEBIRR'
                              ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                              : 'bg-purple-950 text-purple-300 border-purple-800'
                          }`}>
                            {p.bankName}
                          </span>
                        </div>

                        {/* Transaction Ref with One-Tap Copy */}
                        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="text-slate-500 text-[11px]">Ref:</span>
                            <span className="text-emerald-300 font-bold truncate">{p.transactionRef}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(p.transactionRef)}
                            aria-label="Copy transaction reference"
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1 text-[10px] shrink-0 transition-colors ml-2 min-h-[32px]"
                          >
                            {copiedRef === p.transactionRef ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400 font-bold">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Amount Deposited:</span>
                          <span className="font-extrabold text-white text-base">ETB {p.amountETB.toFixed(2)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                          <span className="text-slate-400">Slip Status:</span>
                          {p.status === 'SUBMITTED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                              Pending Verification
                            </span>
                          )}
                          {p.status === 'VERIFIED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                              Verified & Active
                            </span>
                          )}
                          {p.status === 'REJECTED' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                              Rejected
                            </span>
                          )}
                        </div>

                        {p.status === 'SUBMITTED' && (
                          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                            <button
                              onClick={() => handleVerifyPayment(p.id, 'APPROVE')}
                              className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs min-h-[44px] flex items-center justify-center gap-1.5 active:scale-95 transition-all shadow-md shadow-emerald-950 cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[2.5]" />
                              <span>Approve Slip</span>
                            </button>
                            <button
                              onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                              className="py-2.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold rounded-xl text-xs min-h-[44px] flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Desktop Table for Payments */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Payment verification table"
                  className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden table-wrapper"
                >
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="p-3.5">Student</th>
                        <th className="p-3.5">Method</th>
                        <th className="p-3.5">Transaction Ref</th>
                        <th className="p-3.5">Amount</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5">
                            <div className="font-bold text-slate-200">{p.userName}</div>
                            <div className="text-[10px] text-slate-400">{p.userEmail}</div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-emerald-400">{p.bankName}</span>
                          </td>
                          <td className="p-3.5 font-mono text-slate-300 font-bold">
                            <div className="flex items-center gap-2">
                              <span>{p.transactionRef}</span>
                              <button
                                onClick={() => copyToClipboard(p.transactionRef)}
                                className="text-slate-500 hover:text-slate-300 p-1"
                                title="Copy reference"
                              >
                                {copiedRef === p.transactionRef ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 font-bold text-white">ETB {p.amountETB.toFixed(2)}</td>
                          <td className="p-3.5">
                            {p.status === 'SUBMITTED' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                                Pending Verification
                              </span>
                            )}
                            {p.status === 'VERIFIED' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
                                Verified & Active
                              </span>
                            )}
                            {p.status === 'REJECTED' && (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800">
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right space-x-2">
                            {p.status === 'SUBMITTED' ? (
                              <>
                                <button
                                  onClick={() => handleVerifyPayment(p.id, 'APPROVE')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-[11px] min-h-[36px] active:scale-95 transition-all cursor-pointer"
                                >
                                  Approve Slip
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                                  className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-800 font-bold rounded-lg text-[11px] min-h-[36px] active:scale-95 transition-all cursor-pointer"
                                >
                                  Reject
                                </button>
                              </>
                            ) : (
                              <span className="text-[11px] text-slate-500 italic">{p.adminNotes || 'Completed'}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Questions Bank & Review */}
            {activeSection === 'questions' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Question Bank & Review Workflow</h1>
                    <p className="text-xs text-slate-400">
                      Draft, peer review, and publish questions aligned with Ministry of Education blueprints.
                    </p>
                  </div>

                  <div className="relative min-w-[200px] sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Search questions or citations..."
                      value={questionSearch}
                      onChange={(e) => setQuestionSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-hidden min-h-[38px]"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {filteredQuestions.map((q) => (
                    <div key={q.id} className="bg-slate-900 rounded-2xl p-4 border border-slate-800 space-y-3 shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200">{q.programName}</span>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {q.difficulty}
                          </span>
                          {q.status === 'VERIFIED' ? (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                              Verified & Published
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                              Pending Review
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-xs text-slate-200 leading-relaxed">{q.stem}</p>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span className="truncate">Benchmark: {q.referenceSource}</span>
                        {q.status === 'PENDING_REVIEW' && isRoleAllowed(['SUPER_ADMINISTRATOR', 'REVIEWER']) && (
                          <div className="flex items-center gap-2 pt-1 sm:pt-0">
                            <button
                              onClick={() => handleReviewQuestion(q.id, 'APPROVE')}
                              className="flex-1 sm:flex-none px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs min-h-[40px] active:scale-95 transition-all cursor-pointer"
                            >
                              Approve Question
                            </button>
                            <button
                              onClick={() => handleReviewQuestion(q.id, 'REJECT')}
                              className="flex-1 sm:flex-none px-3.5 py-2 bg-rose-600/30 hover:bg-rose-600/40 text-rose-300 font-bold rounded-xl text-xs min-h-[40px] active:scale-95 transition-all cursor-pointer"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Catalog */}
            {activeSection === 'catalog' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Catalog Architecture</h1>
                  <p className="text-xs text-slate-400">
                    Dual catalog separating Academic University Programs from Certified COC Vocational Standards.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-emerald-400 text-sm">University Exit Exam Programs</h3>
                    </div>
                    <ul className="text-xs space-y-2 text-slate-300">
                      <li className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">• Accounting and Finance (ACCFIN) — BSc / BA</li>
                      <li className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">• Management (MGMT) — BA</li>
                      <li className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">• Economics (ECON) — BSc / BA</li>
                      <li className="p-2 rounded-xl bg-slate-950/70 border border-slate-800/80">• Marketing Management (MKTG) — BA</li>
                    </ul>
                  </div>

                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-amber-400 text-sm">COC Occupations (Configurable)</h3>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Configurable catalog architecture. First occupation placeholder awaiting official qualification
                      verification:
                    </p>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300">
                      Accounts & Budget Service / Level IV (Unpublished)
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Users */}
            {activeSection === 'users' && isRoleAllowed(['SUPER_ADMINISTRATOR']) && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">User & Role Management</h1>
                  <p className="text-xs text-slate-400">
                    Manage 5 system roles: Student, Content Editor, Reviewer, Payment Administrator, and Super Administrator.
                  </p>
                </div>

                {/* Mobile User Cards */}
                <div className="space-y-2.5 md:hidden">
                  {Object.values(DEMO_STAFF).map((u) => {
                    const cfg = ROLE_CONFIGS[u.role];
                    const RoleIcon = cfg.icon;
                    return (
                      <div key={u.id} className="bg-slate-900 rounded-2xl p-3.5 border border-slate-800 flex items-center justify-between gap-3 shadow-sm">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cfg.bgColor} border ${cfg.borderColor}`}>
                            <RoleIcon className={`w-4 h-4 ${cfg.textColor}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-200 text-xs sm:text-sm truncate">{u.fullName}</div>
                            <div className="text-[11px] font-mono text-slate-400 truncate">{u.email}</div>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider shrink-0 border ${cfg.borderColor} ${cfg.textColor}`}>
                          {cfg.shortLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Desktop User Table */}
                <div
                  tabIndex={0}
                  role="region"
                  aria-label="Staff user directory"
                  className="hidden md:block bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden table-wrapper"
                >
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] border-b border-slate-800 sticky top-0">
                      <tr>
                        <th className="p-3.5">User</th>
                        <th className="p-3.5">Email</th>
                        <th className="p-3.5">Role</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Object.values(DEMO_STAFF).map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40">
                          <td className="p-3.5 font-bold text-slate-200">{u.fullName}</td>
                          <td className="p-3.5 font-mono text-slate-400">{u.email}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-emerald-300">
                              {u.role.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-3.5">
                            <span className="text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Audit Logs */}
            {activeSection === 'audit' && isRoleAllowed(['SUPER_ADMINISTRATOR']) && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Audit Trail</h1>
                  <p className="text-xs text-slate-400">Tamper-evident logs of administrative operations and payments.</p>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-sm">
                    <div>
                      <span className="font-bold text-emerald-400 text-xs">PAYMENT_VERIFIED</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">Transaction FT26298ABCD1234 approved by Tigist Haile</p>
                    </div>
                    <span className="text-slate-500 text-[10px] shrink-0 font-mono">Today 17:45</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 shadow-sm">
                    <div>
                      <span className="font-bold text-blue-400 text-xs">QUESTION_APPROVED</span>
                      <p className="text-slate-300 text-[11px] mt-0.5">Question q-sample-acc-01 published by Dr. Dawit Tadesse</p>
                    </div>
                    <span className="text-slate-500 text-[10px] shrink-0 font-mono">Today 14:20</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Fixed Bottom Navigation Bar for Mobile Screens */}
      {currentUser && currentRole !== 'STUDENT' && (
        <nav
          aria-label="Mobile Bottom Navigation"
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 h-16 flex items-center justify-around px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-2xl"
        >
          <button
            onClick={() => setActiveSection('overview')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] transition-colors ${
              activeSection === 'overview' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Overview</span>
          </button>

          <button
            onClick={() => setActiveSection('payments')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] transition-colors relative ${
              activeSection === 'payments' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Payments</span>
            {pendingPaymentsCount > 0 && (
              <span className="absolute top-1.5 right-1/4 translate-x-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('questions')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] transition-colors relative ${
              activeSection === 'questions' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Questions</span>
            {pendingQuestionsCount > 0 && (
              <span className="absolute top-1.5 right-1/4 translate-x-1.5 w-4 h-4 rounded-full bg-amber-500 text-slate-950 font-black text-[9px] flex items-center justify-center">
                {pendingQuestionsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveSection('catalog')}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] transition-colors ${
              activeSection === 'catalog' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">Catalog</span>
          </button>

          <button
            onClick={() => setMobileDrawerOpen(true)}
            className={`flex flex-col items-center justify-center flex-1 h-full py-1 min-w-[56px] transition-colors ${
              mobileDrawerOpen ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-bold">More</span>
          </button>
        </nav>
      )}
    </div>
  );
}
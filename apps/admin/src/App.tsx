import React, { useState, useEffect } from 'react';
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
  const [currentRole, setCurrentRole] = useState<StaffRole>('SUPER_ADMINISTRATOR');
  const [activeSection, setActiveSection] = useState<'overview' | 'payments' | 'questions' | 'catalog' | 'users' | 'audit'>('overview');
  const [roleModalOpen, setRoleModalOpen] = useState(false);

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

  // Load API stats if available
  useEffect(() => {
    fetchStats();
  }, [currentRole]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/admin/dashboard`, {
        headers: {
          Authorization: `Bearer mock-token-for-dev`,
        },
      });
      const json = await res.json();
      if (json.success && json.data?.stats) {
        setStats(json.data.stats);
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

  const isRoleAllowed = (allowed: StaffRole[]) => allowed.includes(currentRole);

  const pendingPaymentsCount = payments.filter((p) => p.status === 'SUBMITTED').length;
  const pendingQuestionsCount = questions.filter((q) => q.status === 'PENDING_REVIEW').length;
  const currentRoleConfig = ROLE_CONFIGS[currentRole];
  const CurrentRoleIcon = currentRoleConfig.icon;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sleek Ultra-Compact Security Header Line */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80 px-3 sm:px-4 py-1 text-[11px] text-slate-400">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate text-slate-300 font-medium">ExitPrep Operations Console</span>
            <span className="text-slate-600 hidden xs:inline">•</span>
            <span className="text-slate-500 hidden sm:inline">Restricted to authorized personnel</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800/80 text-amber-300/90 border border-slate-700/60">
              PORT 5174
            </span>
          </div>
        </div>
      </div>

      {/* Main Responsive Header */}
      <header className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 shadow-lg shadow-black/20">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          {/* Left: Brand Identity */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none shrink-0"
            onClick={() => setActiveSection('overview')}
          >
            {/* Logo Badge */}
            <div className="relative">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-800 flex items-center justify-center font-black text-white text-sm sm:text-base shadow-md shadow-emerald-950/60 ring-1 ring-emerald-400/30">
                EP
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>

            {/* Title & Ethiopian Flag */}
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-white text-sm sm:text-base tracking-tight">ExitPrep</span>
                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                  ADMIN 🇪🇹
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium hidden xs:block -mt-0.5">
                Staff Operations Portal
              </p>
            </div>
          </div>

          {/* Right: Attractive Interactive Role Pill */}
          <div className="flex items-center gap-2">
            {/* Role Switcher Pill Button (Mobile & Desktop) */}
            <button
              onClick={() => setRoleModalOpen(true)}
              aria-label="Change staff role"
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border transition-all duration-150 active:scale-95 text-xs font-semibold ${currentRoleConfig.bgColor} ${currentRoleConfig.borderColor}`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${currentRoleConfig.dotColor} animate-pulse`}></span>
                <CurrentRoleIcon className={`w-3.5 h-3.5 ${currentRoleConfig.textColor}`} />
                <span className={`font-bold ${currentRoleConfig.textColor} text-xs`}>
                  {currentRoleConfig.shortLabel}
                </span>
              </div>

              <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-900/80 text-slate-300 font-mono hidden sm:inline">
                {DEMO_STAFF[currentRole].fullName.split(' ')[0]}
              </span>

              <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-0.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Role Switcher Mobile Sheet / Modal */}
      {roleModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div
            className="bg-slate-900 rounded-t-3xl sm:rounded-2xl p-5 sm:p-6 w-full max-w-md border border-slate-800 shadow-2xl relative max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm sm:text-base">Switch Staff Role</h3>
                  <p className="text-[11px] text-slate-400">Simulate role-based access & permissions</p>
                </div>
              </div>
              <button
                onClick={() => setRoleModalOpen(false)}
                aria-label="Close role modal"
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Roles List Cards */}
            <div className="space-y-2">
              {(Object.keys(DEMO_STAFF) as StaffRole[]).map((roleKey) => {
                const conf = ROLE_CONFIGS[roleKey];
                const staff = DEMO_STAFF[roleKey];
                const isSelected = currentRole === roleKey;
                const IconComponent = conf.icon;

                return (
                  <button
                    key={roleKey}
                    onClick={() => {
                      setCurrentRole(roleKey);
                      setRoleModalOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 active:scale-[0.99] ${
                      isSelected
                        ? `${conf.bgColor} ${conf.borderColor} ring-1 ring-emerald-500/30`
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${conf.bgColor} border ${conf.borderColor}`}>
                      <IconComponent className={`w-4 h-4 ${conf.textColor}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className={`font-bold text-xs sm:text-sm truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                          {conf.label}
                        </span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded border ${conf.borderColor} ${conf.textColor}`}>
                          {conf.badge}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-400 font-medium truncate mb-1">
                        {staff.fullName} • <span className="font-mono text-slate-500">{staff.email}</span>
                      </div>

                      <p className="text-[11px] text-slate-500 leading-snug line-clamp-2">
                        {conf.desc}
                      </p>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
              <span>Security: RBAC Enforced</span>
              <span className="text-emerald-400 font-semibold">Active: {currentRoleConfig.shortLabel}</span>
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
              className="w-full sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs min-h-[44px] transition-all active:scale-95 shadow-md shadow-emerald-950"
            >
              Switch to Super Administrator
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 flex flex-col lg:grid lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Mobile Horizontal Navigation Tabs */}
          <div className="lg:hidden flex overflow-x-auto no-scrollbar gap-1.5 pb-2 border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-colors ${
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
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-colors ${
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
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-colors ${
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
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-colors ${
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
                  className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-colors ${
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
                  className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] transition-colors ${
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
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
                activeSection === 'overview'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Dashboard Overview</span>
            </button>

            <button
              onClick={() => setActiveSection('payments')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
                activeSection === 'payments'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span>Payment Verification</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                {pendingPaymentsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('questions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
                activeSection === 'questions'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Question Bank & Review</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-800">
                {pendingQuestionsCount}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('catalog')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
                activeSection === 'catalog'
                  ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Program & COC Catalog</span>
            </button>

            {isRoleAllowed(['SUPER_ADMINISTRATOR']) && (
              <>
                <button
                  onClick={() => setActiveSection('users')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
                    activeSection === 'users'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>User & Role Management</span>
                </button>

                <button
                  onClick={() => setActiveSection('audit')}
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors min-h-[40px] ${
                    activeSection === 'audit'
                      ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                  <span>Security Audit Logs</span>
                </button>
              </>
            )}
          </div>

          {/* Main Area */}
          <div className="lg:col-span-4">
            {/* Overview */}
            {activeSection === 'overview' && (
              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mb-1">Administrative Dashboard</h1>
                  <p className="text-xs text-slate-400">
                    ExitPrep Ethiopia operational overview: active students, question reviews, and pending payment slips.
                  </p>
                </div>

                {/* Metrics with centered icons */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800 text-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Users className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Enrolled Students</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-white">{stats.totalStudents}</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">+12 this week</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800 text-center">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <CreditCard className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Pending Slips</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-amber-400">{pendingPaymentsCount}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">CBE & Telebirr</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800 text-center">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <FileText className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Under Review</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{pendingQuestionsCount}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Awaiting sign-off</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800 text-center">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                      <Award className="w-4 h-4" />
                    </div>
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Subscriptions</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-emerald-400">{stats.activeSubscriptions}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Paid standard/prem</span>
                  </div>
                </div>

                {/* Content Policy Alert */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-300">
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
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Payment Verification Queue</h1>
                    <p className="text-xs text-slate-400">
                      Manually verify bank slips and activate student subscriptions.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchStats()}
                    className="p-2 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 text-xs flex items-center gap-1 min-h-[40px] border border-slate-800"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Refresh</span>
                  </button>
                </div>

                {/* Mobile Cards for Payments */}
                <div className="space-y-3 md:hidden">
                  {payments.map((p) => (
                    <div key={p.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-200 text-sm">{p.userName}</div>
                          <div className="text-[11px] text-slate-400">{p.userEmail}</div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-emerald-400 border border-emerald-900/40 shrink-0">
                          {p.bankName}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-400 text-[11px]">Ref:</span>
                        <span className="text-emerald-300 font-bold">{p.transactionRef}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Amount:</span>
                        <span className="font-bold text-white text-sm">ETB {p.amountETB.toFixed(2)}</span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                        <span className="text-slate-400">Status:</span>
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
                      </div>

                      {p.status === 'SUBMITTED' && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => handleVerifyPayment(p.id, 'APPROVE')}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs min-h-[44px] flex items-center justify-center gap-1 active:scale-95 transition-all shadow-md"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                            className="py-2.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold rounded-lg text-xs min-h-[44px] flex items-center justify-center gap-1 active:scale-95 transition-all"
                          >
                            <X className="w-4 h-4" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Desktop Table for Payments */}
                <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
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
                        {payments.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-800/40">
                            <td className="p-3.5">
                              <div className="font-bold text-slate-200">{p.userName}</div>
                              <div className="text-[10px] text-slate-400">{p.userEmail}</div>
                            </td>
                            <td className="p-3.5">
                              <span className="font-semibold text-emerald-400">{p.bankName}</span>
                            </td>
                            <td className="p-3.5 font-mono text-slate-300 font-bold">{p.transactionRef}</td>
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
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px] min-h-[36px]"
                                  >
                                    Approve Slip
                                  </button>
                                  <button
                                    onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                                    className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-800 font-bold rounded text-[11px] min-h-[36px]"
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
              </div>
            )}

            {/* Questions Bank & Review */}
            {activeSection === 'questions' && (
              <div className="space-y-4">
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-white mb-0.5">Question Bank & Review Workflow</h1>
                  <p className="text-xs text-slate-400">
                    Draft, peer review, and publish questions for Ethiopian university exit and COC examinations.
                  </p>
                </div>

                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                        <span className="text-xs font-bold text-slate-200">{q.programName}</span>
                        <div className="flex items-center gap-2">
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
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 text-white font-bold rounded text-xs min-h-[38px] active:scale-95 transition-transform"
                            >
                              Approve Question
                            </button>
                            <button
                              onClick={() => handleReviewQuestion(q.id, 'REJECT')}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-600/30 text-rose-300 font-bold rounded text-xs min-h-[38px] active:scale-95 transition-transform"
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <h3 className="font-bold text-emerald-400 text-sm mb-2">University Exit Exam Programs</h3>
                    <ul className="text-xs space-y-2 text-slate-300">
                      <li>• Accounting and Finance (ACCFIN) — BSc / BA</li>
                      <li>• Management (MGMT) — BA</li>
                      <li>• Economics (ECON) — BSc / BA</li>
                      <li>• Marketing Management (MKTG) — BA</li>
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
                    <h3 className="font-bold text-amber-400 text-sm mb-2">COC Occupations (Configurable)</h3>
                    <p className="text-xs text-slate-400 mb-2 leading-relaxed">
                      Configurable catalog architecture. First occupation placeholder awaiting official qualification
                      verification:
                    </p>
                    <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-300">
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
                <div className="space-y-3 md:hidden">
                  {Object.values(DEMO_STAFF).map((u) => (
                    <div key={u.id} className="bg-slate-900 rounded-xl p-3.5 border border-slate-800 flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-200 text-xs sm:text-sm">{u.fullName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{u.email}</div>
                      </div>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-emerald-300">
                        {u.role.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Desktop User Table */}
                <div className="hidden md:block bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-950/60 text-slate-400 uppercase text-[10px]">
                      <tr>
                        <th className="p-3">User</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role</th>
                        <th className="p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {Object.values(DEMO_STAFF).map((u) => (
                        <tr key={u.id}>
                          <td className="p-3 font-bold text-slate-200">{u.fullName}</td>
                          <td className="p-3 font-mono text-slate-400">{u.email}</td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-slate-800 text-emerald-300">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-emerald-400 font-semibold">Active</span>
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

                <div className="space-y-2 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-400">PAYMENT_VERIFIED</span>
                      <p className="text-slate-400 text-[11px]">Transaction FT26298ABCD1234 approved by Tigist Haile</p>
                    </div>
                    <span className="text-slate-500 text-[10px] shrink-0">Today 17:45</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-400">QUESTION_APPROVED</span>
                      <p className="text-slate-400 text-[11px]">Question q-sample-acc-01 published by Dr. Dawit Tadesse</p>
                    </div>
                    <span className="text-slate-500 text-[10px] shrink-0">Today 14:20</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
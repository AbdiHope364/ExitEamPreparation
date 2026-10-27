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
  RefreshCw,
  Search,
  Filter,
  Check,
  X,
  Menu,
} from 'lucide-react';

const API_BASE = 'http://localhost:4000';

type StaffRole = 'SUPER_ADMINISTRATOR' | 'PAYMENT_ADMINISTRATOR' | 'REVIEWER' | 'CONTENT_EDITOR' | 'STUDENT';

interface StaffUser {
  id: string;
  fullName: string;
  email: string;
  role: StaffRole;
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Security Notice */}
      <div className="bg-amber-950/80 text-amber-200 text-xs px-3 sm:px-4 py-2 border-b border-amber-900/50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate">ExitPrep Staff Operations — Restricted Access</span>
          </span>
          <span className="text-amber-400/80 font-mono text-[10px] sm:text-[11px] shrink-0">Port 5174</span>
        </div>
      </div>

      {/* Main Header with Universal Role Switcher */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          {/* Logo & Ethiopian Flag */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/50 text-sm sm:text-base shrink-0">
                EP
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-white text-sm sm:text-base">ExitPrep Admin</span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-900/40">
                    ET 🇪🇹
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 hidden xs:block">Verification & Question Review</p>
              </div>
            </div>

            {/* Mobile User Tag */}
            <div className="sm:hidden text-right">
              <span className="text-[10px] text-slate-400 block font-mono">
                {DEMO_STAFF[currentRole].fullName.split(' ')[0]}
              </span>
              <span className="text-[9px] text-emerald-400 font-semibold uppercase">{currentRole.replace('_', ' ')}</span>
            </div>
          </div>

          {/* Role Switcher (Mobile & Desktop Accessible) */}
          <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800">
            <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700 w-full sm:w-auto">
              <span className="text-[11px] text-slate-400 font-medium shrink-0">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as StaffRole)}
                className="bg-slate-900 text-xs font-semibold text-emerald-300 rounded-lg px-2 py-1 border border-slate-700 focus:outline-none w-full sm:w-auto min-h-[36px]"
              >
                <option value="SUPER_ADMINISTRATOR">Super Admin</option>
                <option value="PAYMENT_ADMINISTRATOR">Payment Officer</option>
                <option value="REVIEWER">Academic Reviewer</option>
                <option value="CONTENT_EDITOR">Content Editor</option>
                <option value="STUDENT">Student (Denied)</option>
              </select>
            </div>

            <div className="text-right hidden md:block shrink-0">
              <div className="text-xs font-bold text-slate-200">{DEMO_STAFF[currentRole].fullName}</div>
              <div className="text-[10px] text-slate-400">{DEMO_STAFF[currentRole].email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      {currentRole === 'STUDENT' ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 max-w-md text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white mb-2">Access Denied (Role: STUDENT)</h2>
            <p className="text-xs text-slate-400 mb-5 leading-relaxed">
              Students do not have permission to view or modify question banks, administrative audit logs, or payment
              verifications. Please switch to an administrative role in the selector above.
            </p>
            <button
              onClick={() => setCurrentRole('SUPER_ADMINISTRATOR')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs min-h-[44px]"
            >
              Switch to Super Administrator
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-3 sm:px-4 py-5 sm:py-8 flex flex-col lg:grid lg:grid-cols-5 gap-4 sm:gap-6">
          {/* Mobile Horizontal Navigation Tabs */}
          <div className="lg:hidden flex overflow-x-auto no-scrollbar gap-1.5 pb-2 border-b border-slate-800 text-xs">
            <button
              onClick={() => setActiveSection('overview')}
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                activeSection === 'overview'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveSection('payments')}
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                activeSection === 'payments'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
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
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                activeSection === 'questions'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
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
              className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                activeSection === 'catalog'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog</span>
            </button>

            {isRoleAllowed(['SUPER_ADMINISTRATOR']) && (
              <>
                <button
                  onClick={() => setActiveSection('users')}
                  className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                    activeSection === 'users'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Users</span>
                </button>

                <button
                  onClick={() => setActiveSection('audit')}
                  className={`px-3 py-2 rounded-xl font-semibold shrink-0 flex items-center gap-1.5 min-h-[40px] ${
                    activeSection === 'audit'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:text-white'
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

                {/* Metrics */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Enrolled Students</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-white">{stats.totalStudents}</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">+12 this week</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Pending Slips</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-amber-400">{pendingPaymentsCount}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">CBE & Telebirr</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-[11px] sm:text-xs block mb-1">Under Review</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-blue-400">{pendingQuestionsCount}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Awaiting sign-off</span>
                  </div>

                  <div className="bg-slate-900 p-3.5 sm:p-4 rounded-xl border border-slate-800">
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
                    className="p-2 sm:px-3 sm:py-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 text-xs flex items-center gap-1 min-h-[40px]"
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
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs min-h-[44px] flex items-center justify-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                            className="py-2.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 font-bold rounded-lg text-xs min-h-[44px] flex items-center justify-center gap-1"
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
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-emerald-600 text-white font-bold rounded text-xs min-h-[38px]"
                            >
                              Approve Question
                            </button>
                            <button
                              onClick={() => handleReviewQuestion(q.id, 'REJECT')}
                              className="flex-1 sm:flex-none px-3 py-1.5 bg-rose-600/30 text-rose-300 font-bold rounded text-xs min-h-[38px]"
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
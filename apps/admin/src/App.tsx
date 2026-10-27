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
    pendingPayments: 3,
    pendingQuestions: 8,
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
      stem: 'In capital budgeting, the Internal Rate of Return (IRR) is defined as the discount rate that equates NPV to zero.',
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
            adminNotes: action === 'APPROVE' ? 'Approved against bank statement' : 'Reference mismatch',
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Admin Security Notice */}
      <div className="bg-amber-950/80 text-amber-200 text-xs px-4 py-2 border-b border-amber-900/50 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            ExitPrep Ethiopia Staff Portal — Strictly Restricted to Authorized Administrative Personnel
          </span>
          <span className="text-amber-400/80 font-mono text-[11px]">Local Host: Port 5174</span>
        </div>
      </div>

      {/* Main Header with Role Switcher */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/50">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-white text-base">ExitPrep Admin</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-emerald-900/40">
                  Operations 🇪🇹
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Content, Payments & Exam Verification</p>
            </div>
          </div>

          {/* Quick Role Switcher for Developer Testing */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 p-1 rounded-xl border border-slate-700">
              <span className="text-[11px] text-slate-400 font-medium pl-2">Role Preview:</span>
              <select
                value={currentRole}
                onChange={(e) => setCurrentRole(e.target.value as StaffRole)}
                className="bg-slate-900 text-xs font-semibold text-emerald-300 rounded-lg px-2 py-1 border border-slate-700 focus:outline-none"
              >
                <option value="SUPER_ADMINISTRATOR">Super Administrator</option>
                <option value="PAYMENT_ADMINISTRATOR">Payment Officer (Finance)</option>
                <option value="REVIEWER">Academic Reviewer</option>
                <option value="CONTENT_EDITOR">Content Editor</option>
                <option value="STUDENT">Student (Access Denied)</option>
              </select>
            </div>

            <div className="text-right hidden md:block">
              <div className="text-xs font-bold text-slate-200">{DEMO_STAFF[currentRole].fullName}</div>
              <div className="text-[10px] text-slate-400">{DEMO_STAFF[currentRole].email}</div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      {currentRole === 'STUDENT' ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md text-center shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-rose-950 border border-rose-800 text-rose-400 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white mb-2">Access Denied (Role: STUDENT)</h2>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Students do not have permission to view or modify question banks, administrative audit logs, or payment
              verifications. Please switch to an administrative role above.
            </p>
            <button
              onClick={() => setCurrentRole('SUPER_ADMINISTRATOR')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs"
            >
              Switch to Super Administrator
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 grid lg:grid-cols-5 gap-6">
          {/* Sidebar Menu */}
          <div className="lg:col-span-1 space-y-1">
            <button
              onClick={() => setActiveSection('overview')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
                {payments.filter((p) => p.status === 'SUBMITTED').length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('questions')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
                {questions.filter((q) => q.status === 'PENDING_REVIEW').length}
              </span>
            </button>

            <button
              onClick={() => setActiveSection('catalog')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
                  className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
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
              <div className="space-y-6">
                <div>
                  <h1 className="text-xl font-bold text-white mb-1">Administrative Dashboard</h1>
                  <p className="text-xs text-slate-400">
                    ExitPrep Ethiopia operational overview: active students, question reviews, and pending payment slips.
                  </p>
                </div>

                {/* Metrics */}
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block mb-1">Enrolled Students</span>
                    <span className="text-2xl font-extrabold text-white">{stats.totalStudents}</span>
                    <span className="text-[10px] text-emerald-400 block mt-1">+12 this week</span>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block mb-1">Pending CBE / Telebirr</span>
                    <span className="text-2xl font-extrabold text-amber-400">{payments.filter((p) => p.status === 'SUBMITTED').length}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Awaiting manual approval</span>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block mb-1">Questions Under Review</span>
                    <span className="text-2xl font-extrabold text-blue-400">{questions.filter((q) => q.status === 'PENDING_REVIEW').length}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Awaiting reviewer sign-off</span>
                  </div>

                  <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                    <span className="text-slate-400 text-xs block mb-1">Active Subscriptions</span>
                    <span className="text-2xl font-extrabold text-emerald-400">{stats.activeSubscriptions}</span>
                    <span className="text-[10px] text-slate-400 block mt-1">Paid standard/premium</span>
                  </div>
                </div>

                {/* Content Policy Alert */}
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 text-xs text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span>Content Integrity Policy Active</span>
                  </div>
                  <p className="text-emerald-300/80 leading-relaxed">
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
                    <h1 className="text-xl font-bold text-white mb-1">CBE & Telebirr Payment Verification</h1>
                    <p className="text-xs text-slate-400">
                      Manually verify bank slips and activate student subscriptions idempotently.
                    </p>
                  </div>
                  <button
                    onClick={() => fetchStats()}
                    className="p-2 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-300 text-xs flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Refresh</span>
                  </button>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
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
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded text-[11px]"
                                  >
                                    Approve Slip
                                  </button>
                                  <button
                                    onClick={() => handleVerifyPayment(p.id, 'REJECT')}
                                    className="px-2.5 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-800 font-bold rounded text-[11px]"
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
                  <h1 className="text-xl font-bold text-white mb-1">Question Bank & Review Workflow</h1>
                  <p className="text-xs text-slate-400">
                    Draft, peer review, and publish questions for Ethiopian university exit and COC examinations.
                  </p>
                </div>

                <div className="space-y-3">
                  {questions.map((q) => (
                    <div key={q.id} className="bg-slate-900 rounded-xl p-4 border border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-300">{q.programName}</span>
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

                      <p className="text-xs text-slate-200 mb-3">{q.stem}</p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>Citation: {q.referenceSource}</span>
                        {q.status === 'PENDING_REVIEW' && isRoleAllowed(['SUPER_ADMINISTRATOR', 'REVIEWER']) && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReviewQuestion(q.id, 'APPROVE')}
                              className="px-2.5 py-1 bg-emerald-600 text-white font-bold rounded text-[11px]"
                            >
                              Approve Question
                            </button>
                            <button
                              onClick={() => handleReviewQuestion(q.id, 'REJECT')}
                              className="px-2.5 py-1 bg-rose-600/30 text-rose-300 font-bold rounded text-[11px]"
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
                  <h1 className="text-xl font-bold text-white mb-1">Catalog Architecture</h1>
                  <p className="text-xs text-slate-400">
                    Dual catalog separating Academic University Programs from Certified COC Vocational Standards.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
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
                    <p className="text-xs text-slate-400 mb-2">
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
                  <h1 className="text-xl font-bold text-white mb-1">User & Role Management</h1>
                  <p className="text-xs text-slate-400">
                    Manage 5 system roles: Student, Content Editor, Reviewer, Payment Administrator, and Super Administrator.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
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
                  <h1 className="text-xl font-bold text-white mb-1">Audit Trail</h1>
                  <p className="text-xs text-slate-400">Tamper-evident logs of administrative operations and payments.</p>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-emerald-400">PAYMENT_VERIFIED</span>
                      <p className="text-slate-400 text-[11px]">Transaction FT26298ABCD1234 approved by Tigist Haile</p>
                    </div>
                    <span className="text-slate-500 text-[10px]">Today 17:45</span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-blue-400">QUESTION_APPROVED</span>
                      <p className="text-slate-400 text-[11px]">Question q-sample-acc-01 published by Dr. Dawit Tadesse</p>
                    </div>
                    <span className="text-slate-500 text-[10px]">Today 14:20</span>
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

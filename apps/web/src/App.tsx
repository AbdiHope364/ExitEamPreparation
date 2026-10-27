import React, { useState, useEffect, useRef } from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  User,
  CreditCard,
  LogOut,
  Sparkles,
  Layers,
  ArrowRight,
  HelpCircle,
  Menu,
  X,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';

const API_BASE = 'http://localhost:4000';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface QuestionOption {
  id: string;
  text: string;
  orderIndex: number;
}

interface Question {
  id: string;
  stem: string;
  difficulty: string;
  referenceSource?: string;
  options: QuestionOption[];
}

interface Evaluation {
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string;
  referenceSource?: string;
}

const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 'q-sample-acc-01',
    stem: 'Which of the following forms of audit evidence is generally considered the most reliable by an independent auditor during a financial statement audit?',
    difficulty: 'INTERMEDIATE',
    referenceSource: 'Ethiopian Higher Education Exit Exam Blueprint / ISA 500',
    options: [
      { id: 'opt-01', text: 'Direct confirmation sent to the auditor from an independent financial institution.', orderIndex: 0 },
      { id: 'opt-02', text: 'Internally generated sales invoice copies stored in the client filing department.', orderIndex: 1 },
      { id: 'opt-03', text: 'Oral representations obtained from the company managing director during inquiries.', orderIndex: 2 },
      { id: 'opt-04', text: 'Client-prepared quarterly bank reconciliation summary sheets.', orderIndex: 3 },
    ],
  },
  {
    id: 'q-sample-acc-02',
    stem: 'Under the Ethiopian Federal Income Tax Proclamation No. 979/2016, which category of taxpayer includes bodies incorporated under Ethiopian law or having annual gross turnover exceeding 1,000,000 ETB?',
    difficulty: 'INTERMEDIATE',
    referenceSource: 'Federal Income Tax Proclamation No. 979/2016, Art. 18',
    options: [
      { id: 'opt-05', text: 'Category "A" Taxpayers', orderIndex: 0 },
      { id: 'opt-06', text: 'Category "B" Taxpayers', orderIndex: 1 },
      { id: 'opt-07', text: 'Category "C" Taxpayers', orderIndex: 2 },
      { id: 'opt-08', text: 'Exempt Micro-Enterprise entities only', orderIndex: 3 },
    ],
  },
  {
    id: 'q-sample-mgmt-03',
    stem: 'In managerial decision-making and capital budgeting, what is the Net Present Value (NPV) decision rule when evaluating independent capital projects?',
    difficulty: 'BEGINNER',
    referenceSource: 'Higher Education Management / Financial Management Blueprint',
    options: [
      { id: 'opt-09', text: 'Accept the project if Net Present Value is strictly greater than zero (NPV > 0).', orderIndex: 0 },
      { id: 'opt-10', text: 'Accept the project only if the payback period is exactly 12 months regardless of NPV.', orderIndex: 1 },
      { id: 'opt-11', text: 'Reject all projects whose internal rate of return equals the cost of capital.', orderIndex: 2 },
      { id: 'opt-12', text: 'Accept the project with the highest initial negative cash outlay.', orderIndex: 3 },
    ],
  },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'catalog' | 'practice' | 'pricing' | 'profile'>('home');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Auth form state
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Practice state
  const [questions, setQuestions] = useState<Question[]>(FALLBACK_QUESTIONS);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Payment state
  const [selectedPlanId, setSelectedPlanId] = useState('plan-std-02');
  const [bankName, setBankName] = useState('TELEBIRR');
  const [txnRef, setTxnRef] = useState('');
  const [paymentMsg, setPaymentMsg] = useState<{ success: boolean; text: string } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const paymentFormRef = useRef<HTMLDivElement>(null);

  // Load questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    setLoadingQuestions(true);
    try {
      const res = await fetch(`${API_BASE}/api/v1/practice/questions?programId=prog-accfin-01`);
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        setQuestions(json.data);
        setCurrentQIndex(0);
        setSelectedOptionId(null);
        setEvaluation(null);
      }
    } catch {
      // Keep verified fallback questions for offline visual testing
      setQuestions(FALLBACK_QUESTIONS);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleCheckAnswer = async () => {
    if (!selectedOptionId || !questions[currentQIndex]) return;

    try {
      const res = await fetch(`${API_BASE}/api/v1/practice/check-answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: questions[currentQIndex].id,
          selectedOptionId,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setEvaluation(json.data);
        return;
      }
    } catch {
      // Offline fallback evaluations
    }

    // Local evaluation fallback
    if (questions[currentQIndex].id === 'q-sample-acc-01') {
      const isCorrect = selectedOptionId === 'opt-01';
      setEvaluation({
        isCorrect,
        correctOptionId: 'opt-01',
        explanation: 'Evidence obtained directly by the auditor through independent physical inspection or direct external confirmations from third parties provides the highest level of reliability under ISA 500.',
        referenceSource: 'ISA 500 (Audit Evidence)',
      });
    } else if (questions[currentQIndex].id === 'q-sample-acc-02') {
      const isCorrect = selectedOptionId === 'opt-05';
      setEvaluation({
        isCorrect,
        correctOptionId: 'opt-05',
        explanation: 'Art. 18 of Proclamation No. 979/2016 classifies any incorporated company or individual enterprise having annual gross income of 1,000,000 ETB or more as Category "A".',
        referenceSource: 'Ethiopian Federal Income Tax Proclamation 979/2016',
      });
    } else {
      const isCorrect = selectedOptionId === 'opt-09';
      setEvaluation({
        isCorrect,
        correctOptionId: 'opt-09',
        explanation: 'When evaluating independent projects, the firm creates shareholder wealth whenever NPV > 0 at the designated cost of capital.',
        referenceSource: 'Higher Education Management / Financial Management Blueprint',
      });
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const endpoint = authMode === 'login' ? '/api/v1/auth/login' : '/api/v1/auth/register';
    const body =
      authMode === 'login'
        ? { email: authEmail, password: authPassword }
        : { email: authEmail, fullName: authName, password: authPassword };

    try {
      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setUser(json.data.user);
        setToken(json.data.tokens.accessToken);
        setShowAuthModal(false);
      } else {
        setAuthError(json.error?.message || 'Authentication failed');
      }
    } catch {
      setAuthError('Could not reach ExitPrep API on localhost:4000. Ensure the API is running.');
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentMsg(null);

    if (!user || !token) {
      setShowAuthModal(true);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/subscriptions/payments/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          planId: selectedPlanId,
          bankName,
          transactionRef: txnRef,
          amountETB: selectedPlanId === 'plan-std-02' ? 150 : 350,
          notes: 'Submitted via web student portal',
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPaymentMsg({
          success: true,
          text: `Success! Receipt (${txnRef}) submitted. Our finance team will verify your CBE/Telebirr payment shortly.`,
        });
        setTxnRef('');
      } else {
        setPaymentMsg({ success: false, text: json.error?.message || 'Payment submission failed' });
      }
    } catch {
      setPaymentMsg({ success: false, text: 'Could not connect to payment API. Check your connection.' });
    }
  };

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const loginDemoStudent = () => {
    setAuthEmail('student@exitprep.et');
    setAuthPassword('ExitPrep@2026!');
    setAuthMode('login');
    setShowAuthModal(true);
  };

  const scrollToPaymentForm = (planId: string) => {
    setSelectedPlanId(planId);
    if (paymentFormRef.current) {
      paymentFormRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentQ = questions[currentQIndex] || questions[0];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Notice: Content Integrity Decision */}
      <div className="bg-emerald-950 text-emerald-200 text-xs px-3 sm:px-4 py-2 border-b border-emerald-800/50">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="truncate">ExitPrep Ethiopia — MoE & COC Standards Grounded</span>
          </span>
          <span className="hidden sm:inline text-emerald-300/80 shrink-0 text-[11px]">Port 5173</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
          {/* Logo & Ethiopian Flag Pill */}
          <div
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer shrink-0"
            onClick={() => {
              setActiveTab('home');
              setMobileMenuOpen(false);
            }}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 flex items-center justify-center shadow-md shadow-emerald-700/20 text-white font-bold text-lg sm:text-xl shrink-0">
              EP
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg">ExitPrep</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  ET 🇪🇹
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium hidden xs:block">
                National Exam Engine
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('home')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'home' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'catalog' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Exam Pathways
            </button>
            <button
              onClick={() => setActiveTab('practice')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'practice' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Free Practice
            </button>
            <button
              onClick={() => setActiveTab('pricing')}
              className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'pricing' ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Subscriptions
            </button>
          </nav>

          {/* User Auth Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium hover:bg-slate-100 transition-colors min-h-[40px]"
                >
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="max-w-[80px] sm:max-w-none truncate">{user.fullName.split(' ')[0]}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 py-0.5 rounded font-bold hidden sm:inline">
                    {user.role}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setUser(null);
                    setToken(null);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 min-h-[40px] min-w-[40px] flex items-center justify-center"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors min-h-[40px]"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-3 sm:px-4 py-2 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all active:scale-95 min-h-[40px]"
                >
                  Join Free
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-150">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
                activeTab === 'home' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
                activeTab === 'catalog' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Exam Pathways & Blueprints</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('practice');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
                activeTab === 'practice' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="w-4 h-4 text-emerald-600" />
              <span>Free Practice Questions</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('pricing');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2.5 ${
                activeTab === 'pricing' ? 'bg-emerald-50 text-emerald-800' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>Subscriptions (CBE / Telebirr)</span>
            </button>

            <div className="pt-2 mt-2 border-t border-slate-100 flex flex-col gap-2">
              {!user ? (
                <button
                  onClick={() => {
                    loginDemoStudent();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 rounded-xl"
                >
                  ⚡ Login as Demo Student
                </button>
              ) : (
                <button
                  onClick={() => {
                    setActiveTab('profile');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-2.5 text-center text-xs font-semibold text-slate-700 bg-slate-100 rounded-xl"
                >
                  View Profile ({user.fullName})
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Content Body with bottom padding for mobile navigation */}
      <main className="flex-1 pb-28 md:pb-12">
        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 py-10 md:py-16 px-4 border-b border-slate-200">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-5">
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>National University Exit & COC Platform</span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight sm:leading-tight mb-4">
                  Prepare for Ethiopia’s National{' '}
                  <span className="text-emerald-700 underline decoration-amber-400 decoration-wavy underline-offset-4 sm:underline-offset-8">
                    Exit & COC Exams
                  </span>
                </h1>
                <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-6 sm:mb-8">
                  Mobile-first assessment platform tailored for Ethiopian university graduates and TVET candidates.
                  Practice verified questions, take server-timed mock exams, and review official benchmark explanations.
                </p>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 max-w-md mx-auto sm:max-w-none">
                  <button
                    onClick={() => setActiveTab('practice')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-transform active:scale-98 min-h-[48px]"
                  >
                    <span>Start Free Practice Now</span>
                    <ArrowRight className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-colors min-h-[48px]"
                  >
                    Explore Departments & Blueprint
                  </button>
                </div>

                {!user && (
                  <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200/60 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span>Quick test mode:</span>
                    <button
                      onClick={loginDemoStudent}
                      className="text-emerald-700 font-semibold underline hover:text-emerald-800 p-1"
                    >
                      Login as Demo Student
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Dual Pathways Grid */}
            <section className="max-w-7xl mx-auto px-3 sm:px-4 py-8 sm:py-12">
              <div className="text-center mb-8 sm:mb-10">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Dual Preparation Pathways</h2>
                <p className="text-xs sm:text-sm md:text-base text-slate-600">
                  Shared exam engine catering to academic degrees and certified vocational qualifications.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {/* Pathway 1: University Exit Exam */}
                <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                      MoE University Mandate
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">University Exit Exam</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                      Standardized assessments for graduating university students. Multiple business-related departments
                      available at launch: Accounting & Finance, Management, Economics, and Marketing Management.
                    </p>
                    <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Curriculum aligned with Higher Education Ministry blueprints</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>100-Question 2-hour server timed simulations</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Topic-by-topic competency breakdown & diagnostics</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="text-xs sm:text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5 p-1"
                    >
                      <span>View University Programs</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pathway 2: COC Competency Exam */}
                <div className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110 pointer-events-none"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold mb-2">
                      Center of Competence (COC)
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2.5">COC Competency Assessment</h3>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-5">
                      Vocational competency assessment for certified technical occupations. Configurable architecture designed
                      for Level IV & Level V standards, awaiting official qualification verification.
                    </p>
                    <ul className="space-y-2.5 text-xs text-slate-700 mb-6">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Occupational standards catalog configurable by qualification level</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Practical task blueprints & knowledge assessment simulation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Published strictly after qualified expert verification</span>
                      </li>
                    </ul>
                    <button
                      onClick={() => setActiveTab('catalog')}
                      className="text-xs sm:text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5 p-1"
                    >
                      <span>Inspect COC Qualification Blueprint</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Features */}
            <section className="bg-slate-100/70 py-8 sm:py-12 px-3 sm:px-4 border-t border-slate-200">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-2">Built for the Ethiopian Student Experience</h2>
                  <p className="text-xs sm:text-sm text-slate-600">Engineered for mobile browsers, low data consumption, and local payment workflows.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Strict Content Rule</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      No invented curricula or unofficial questions. Every question is reviewed by academic reviewers with verified citations.
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Server-Enforced Timing</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Mock exam attempts calculate duration on the backend, safeguarding against client clock manipulation.
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">CBE & Telebirr Verification</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Deposit via CBE or transfer via Telebirr. Submit your transaction code for quick administrative verification.
                    </p>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Department Specialization</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Business faculty focus: Accounting & Finance, Management, Economics, and Marketing modules categorized accurately.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Tab: Catalog */}
        {activeTab === 'catalog' && (
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Program Catalog & Blueprints</h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Explore supported university business curricula and occupational qualifications.
              </p>
            </div>

            <div className="space-y-6">
              {/* Category 1 */}
              <div>
                <div className="flex items-center gap-2 mb-3.5">
                  <BookOpen className="w-5 h-5 text-emerald-700 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">University Exit Examination (Business Programs)</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Accounting and Finance</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BSc / BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                      Core focus: Auditing & Assurance, Financial Accounting I-III, Cost & Managerial Accounting, Ethiopian Taxation Law, and Corporate Finance.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline p-1"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Management</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                      Core focus: Strategic Management, Operations Management, Organizational Behavior, Project Management, and Business Research Methods.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline p-1"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Economics</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BSc / BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                      Core focus: Microeconomics, Macroeconomics, Introduction to Econometrics, Development Economics, and Ethiopian Economic Structure.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline p-1"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900 text-sm sm:text-base">Marketing Management</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-3.5 leading-relaxed">
                      Core focus: Consumer Behavior, Strategic Marketing, Sales Management, Marketing Communications, and International Marketing.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline p-1"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 2 */}
              <div className="pt-5 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-3.5">
                  <Award className="w-5 h-5 text-amber-700 shrink-0" />
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">COC Occupational Competency Catalog</h2>
                </div>

                <div className="bg-amber-50/60 rounded-xl p-4 sm:p-5 border border-amber-200/80">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">Accounts & Budget Service</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900 shrink-0">
                          Level IV
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mb-2 leading-relaxed max-w-2xl">
                        Awaiting official occupational standards verification. Per product rule, competency units and mock assessments remain unpublished until verified with qualified assessors.
                      </p>
                    </div>
                    <span className="self-start text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded shrink-0">
                      In Verification
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Practice Interface */}
        {activeTab === 'practice' && (
          <div className="max-w-3xl mx-auto px-3 sm:px-4 py-5 sm:py-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div>
                <span className="text-[11px] sm:text-xs font-bold text-emerald-700 uppercase tracking-wider">Free Practice Engine</span>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">Sample Exit Exam Questions</h1>
              </div>
              <button
                onClick={fetchQuestions}
                className="p-2.5 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Reload Questions"
              >
                <RefreshCw className={`w-4 h-4 ${loadingQuestions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {/* Visual Progress Bar on Mobile */}
            <div className="w-full bg-slate-200 rounded-full h-1.5 sm:h-2 mb-4 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${((currentQIndex + 1) / questions.length) * 100}%` }}
              ></div>
            </div>

            {questions.length > 0 ? (
              <div className="bg-white rounded-2xl p-4 sm:p-7 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-3 sm:mb-4">
                  <span className="font-semibold text-slate-700">
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-bold uppercase text-[10px] sm:text-xs">
                    {currentQ.difficulty}
                  </span>
                </div>

                {/* Question Stem */}
                <h2 className="text-sm sm:text-base md:text-lg font-bold text-slate-900 leading-snug sm:leading-relaxed mb-5 sm:mb-6">
                  {currentQ.stem}
                </h2>

                {/* Options List */}
                <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
                  {currentQ.options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isEvaluated = evaluation !== null;
                    const isCorrectOption = evaluation?.correctOptionId === opt.id;
                    const isSelectedWrong = isEvaluated && isSelected && !evaluation.isCorrect;

                    let optClasses = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800';

                    if (isSelected && !isEvaluated) {
                      optClasses = 'border-emerald-600 bg-emerald-50/60 text-emerald-900 ring-2 ring-emerald-500/20';
                    } else if (isEvaluated) {
                      if (isCorrectOption) {
                        optClasses = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold ring-1 ring-emerald-500';
                      } else if (isSelectedWrong) {
                        optClasses = 'border-rose-500 bg-rose-50 text-rose-950';
                      } else {
                        optClasses = 'border-slate-200 bg-slate-50/40 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isEvaluated}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`w-full text-left p-3.5 sm:p-4 rounded-xl border transition-all text-xs sm:text-sm leading-normal flex items-start gap-3 min-h-[50px] active:scale-[0.99] ${optClasses}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + opt.orderIndex)}
                        </span>
                        <span className="flex-1 pt-0.5">{opt.text}</span>
                        {isEvaluated && isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                        )}
                        {isEvaluated && isSelectedWrong && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Action Buttons */}
                {!evaluation ? (
                  <button
                    disabled={!selectedOptionId}
                    onClick={handleCheckAnswer}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all active:scale-98 min-h-[48px] text-sm"
                  >
                    Check Answer
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Explanation Box */}
                    <div
                      className={`p-4 rounded-xl border ${
                        evaluation.isCorrect
                          ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/90 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1.5">
                        {evaluation.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Correct! Excellent answer.</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                            <span>Incorrect. Review official explanation:</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs sm:text-sm leading-relaxed mb-2.5">{evaluation.explanation}</p>
                      {evaluation.referenceSource && (
                        <div className="text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-200/60 flex items-center gap-1.5">
                          <span className="shrink-0">Benchmark Source:</span>
                          <span className="italic truncate">{evaluation.referenceSource}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5">
                      {questions.length > 1 && (
                        <button
                          onClick={() => {
                            const prevIdx = (currentQIndex - 1 + questions.length) % questions.length;
                            setCurrentQIndex(prevIdx);
                            setSelectedOptionId(null);
                            setEvaluation(null);
                          }}
                          className="px-4 py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs sm:text-sm flex items-center gap-1 min-h-[48px]"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          <span className="hidden xs:inline">Previous</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          const nextIdx = (currentQIndex + 1) % questions.length;
                          setCurrentQIndex(nextIdx);
                          setSelectedOptionId(null);
                          setEvaluation(null);
                        }}
                        className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all min-h-[48px] text-xs sm:text-sm flex items-center justify-center gap-1"
                      >
                        <span>Next Question</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-xl border border-slate-200 p-6">
                <p className="text-slate-600 text-xs sm:text-sm mb-4">No verified practice questions loaded yet.</p>
                <button
                  onClick={fetchQuestions}
                  className="px-4 py-2.5 bg-emerald-600 text-white font-bold rounded-lg text-xs min-h-[40px]"
                >
                  Reload Questions
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Subscriptions & Payment Submission */}
        {activeTab === 'pricing' && (
          <div className="max-w-5xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Affordable Access</span>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 mb-2 sm:mb-3">
                Free Practice + Paid Subscriptions
              </h1>
              <p className="text-xs sm:text-sm text-slate-600">
                Practice verified sample questions for free. Upgrade to unlock full-length timed mock exams with manual CBE
                or Telebirr verification.
              </p>
            </div>

            {/* Plans Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {/* Free Tier */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1">Free Practice Tier</h3>
                  <p className="text-xs text-slate-500 mb-3 sm:mb-4">Essential preparation starter</p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
                    ETB 0 <span className="text-xs font-normal text-slate-500">/ forever</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Verified sample questions across business disciplines</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Instant answer check & detailed benchmark explanations</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => setActiveTab('practice')}
                  className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors min-h-[44px]"
                >
                  Practice Free
                </button>
              </div>

              {/* Monthly Plan */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border-2 border-emerald-600 shadow-md relative flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Most Popular
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1">Standard Monthly</h3>
                  <p className="text-xs text-slate-500 mb-3 sm:mb-4">Full question bank access</p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
                    ETB 150 <span className="text-xs font-normal text-slate-500">/ 30 days</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>All questions across accounting, management & economics</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Full syllabus topic-by-topic drills</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Pay easily via Telebirr or CBE Mobile</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => scrollToPaymentForm('plan-std-02')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors min-h-[44px]"
                >
                  Select Monthly Pass
                </button>
              </div>

              {/* Semester Pass */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-base sm:text-lg mb-1">Premium Semester</h3>
                  <p className="text-xs text-slate-500 mb-3 sm:mb-4">Graduation exam pass guarantee</p>
                  <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-4">
                    ETB 350 <span className="text-xs font-normal text-slate-500">/ 120 days</span>
                  </div>
                  <ul className="space-y-2.5 text-xs text-slate-600 mb-6">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Unlimited server-timed 2-hour mock exams</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>MoE blueprint question proportion simulation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Priority manual verification review</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={() => scrollToPaymentForm('plan-prem-03')}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors min-h-[44px]"
                >
                  Select Semester Pass
                </button>
              </div>
            </div>

            {/* Manual Payment Submission Form */}
            <div ref={paymentFormRef} className="bg-white rounded-2xl p-5 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto scroll-mt-24">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-1">Submit Payment Slip (CBE / Telebirr)</h2>
              <p className="text-xs text-slate-600 mb-5 leading-relaxed">
                Transfer the subscription fee using either Commercial Bank of Ethiopia (CBE) or Telebirr, then input your
                transaction reference code below for admin verification.
              </p>

              {/* Bank Details Card with One-Tap Copy on Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-5 text-xs text-slate-700">
                <div className="flex items-center justify-between sm:block">
                  <div>
                    <span className="font-bold text-slate-900 block mb-0.5">Commercial Bank of Ethiopia (CBE):</span>
                    <span>Account: </span>
                    <span className="font-mono font-bold text-emerald-800">1000234567891</span>
                    <br className="hidden sm:inline" />
                    <span className="text-[11px] text-slate-500 block sm:inline"> Name: ExitPrep Ethiopia Ltd</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('1000234567891', 'cbe')}
                    className="p-2 ml-2 sm:ml-0 sm:mt-2 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 shrink-0 min-h-[36px]"
                    title="Copy Account Number"
                  >
                    {copiedField === 'cbe' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-semibold text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px] font-semibold">Copy</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="flex items-center justify-between sm:block pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                  <div>
                    <span className="font-bold text-slate-900 block mb-0.5">Telebirr Merchant Pay:</span>
                    <span>Pay Code: </span>
                    <span className="font-mono font-bold text-emerald-800">882200</span>
                    <br className="hidden sm:inline" />
                    <span className="text-[11px] text-slate-500 block sm:inline"> Phone: 0911-223344</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('882200', 'telebirr')}
                    className="p-2 ml-2 sm:ml-0 sm:mt-2 text-xs rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 flex items-center gap-1 shrink-0 min-h-[36px]"
                    title="Copy Merchant Code"
                  >
                    {copiedField === 'telebirr' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-[11px] font-semibold text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-[11px] font-semibold">Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {paymentMsg && (
                <div
                  className={`p-3.5 rounded-xl text-xs font-semibold mb-4 ${
                    paymentMsg.success
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}
                >
                  {paymentMsg.text}
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Selected Plan</label>
                  <select
                    value={selectedPlanId}
                    onChange={(e) => setSelectedPlanId(e.target.value)}
                    className="w-full text-base sm:text-xs p-3 sm:p-2.5 rounded-lg border border-slate-300 bg-white font-medium min-h-[44px]"
                  >
                    <option value="plan-std-02">Standard Monthly — ETB 150</option>
                    <option value="plan-prem-03">Premium Semester — ETB 350</option>
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full text-base sm:text-xs p-3 sm:p-2.5 rounded-lg border border-slate-300 bg-white font-medium min-h-[44px]"
                    >
                      <option value="TELEBIRR">Telebirr</option>
                      <option value="CBE">Commercial Bank of Ethiopia (CBE)</option>
                      <option value="BOA">Bank of Abyssinia</option>
                      <option value="AWASH">Awash Bank</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / FT Code</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. FT26298ABCD1234"
                      value={txnRef}
                      onChange={(e) => setTxnRef(e.target.value)}
                      className="w-full text-base sm:text-xs p-3 sm:p-2.5 rounded-lg border border-slate-300 font-mono uppercase min-h-[44px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition-all active:scale-98 min-h-[48px]"
                >
                  Submit Payment for Verification
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-5 sm:mb-6">Student Account</h1>

            {user ? (
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-5 sm:space-y-6">
                <div className="flex items-center gap-3.5 sm:gap-4">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-lg sm:text-xl shrink-0">
                    {user.fullName[0]}
                  </div>
                  <div className="truncate">
                    <h2 className="font-bold text-slate-900 text-base sm:text-lg truncate">{user.fullName}</h2>
                    <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    <span className="inline-block mt-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      Role: {user.role}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Subscription Status:</span>
                    <span className="font-bold text-emerald-700">Active Free Tier</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Selected University Dept:</span>
                    <span className="font-semibold text-slate-800">Accounting & Finance</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setUser(null);
                    setToken(null);
                  }}
                  className="w-full py-3 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition-colors min-h-[44px]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
                <User className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1 text-base">Sign in to view your profile</h3>
                <p className="text-xs text-slate-500 mb-4">Track mock exam progress and manage subscriptions.</p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl text-xs sm:text-sm min-h-[44px]"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal (Responsive Sheet) */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl p-6 md:p-8 max-w-sm w-full border border-slate-200 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAuthModal(false)}
              aria-label="Close modal"
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-5 sm:mb-6">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
                {authMode === 'login' ? 'Sign In to ExitPrep' : 'Create Student Account'}
              </h2>
              <p className="text-xs text-slate-500 mt-1">Ethiopian University Exit & COC Exam Portal</p>
            </div>

            {authError && (
              <div className="p-3 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-3.5 text-xs">
              {authMode === 'register' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kidus Yohannes"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full text-base sm:text-xs p-3 sm:p-2.5 rounded-lg border border-slate-300 min-h-[44px]"
                  />
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="student@exitprep.et"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full text-base sm:text-xs p-3 sm:p-2.5 rounded-lg border border-slate-300 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full text-base sm:text-xs p-3 sm:p-2.5 rounded-lg border border-slate-300 min-h-[44px]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs sm:text-sm shadow-md transition-all active:scale-98 min-h-[48px] mt-2"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-500">
              {authMode === 'login' ? (
                <span>
                  Don’t have an account?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('register');
                      setAuthError(null);
                    }}
                    className="text-emerald-700 font-bold hover:underline p-1"
                  >
                    Register
                  </button>
                </span>
              ) : (
                <span>
                  Already registered?{' '}
                  <button
                    onClick={() => {
                      setAuthMode('login');
                      setAuthError(null);
                    }}
                    className="text-emerald-700 font-bold hover:underline p-1"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar (WCAG compliant touch targets & Safe-Area padding) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 h-16 flex items-center justify-around px-2 pb-[max(0.25rem,env(safe-area-inset-bottom))] shadow-lg">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] text-[11px] font-bold transition-colors ${
            activeTab === 'home' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-5 h-5 shrink-0" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] text-[11px] font-bold transition-colors ${
            activeTab === 'catalog' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-5 h-5 shrink-0" />
          <span>Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] text-[11px] font-bold transition-colors ${
            activeTab === 'practice' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-5 h-5 shrink-0" />
          <span>Practice</span>
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] text-[11px] font-bold transition-colors ${
            activeTab === 'pricing' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-5 h-5 shrink-0" />
          <span>Plans</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] text-[11px] font-bold transition-colors ${
            activeTab === 'profile' ? 'text-emerald-700' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <User className="w-5 h-5 shrink-0" />
          <span>Account</span>
        </button>
      </nav>
    </div>
  );
}
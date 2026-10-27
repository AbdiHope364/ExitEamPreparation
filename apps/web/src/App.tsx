import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  ChevronRight,
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
} from 'lucide-react';

const API_BASE = 'http://localhost:4000';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

interface Question {
  id: string;
  stem: string;
  difficulty: string;
  referenceSource?: string;
  options: { id: string; text: string; orderIndex: number }[];
}

interface Evaluation {
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string;
  referenceSource?: string;
}

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
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Payment state
  const [selectedPlanId, setSelectedPlanId] = useState('plan-std-02');
  const [bankName, setBankName] = useState('TELEBIRR');
  const [txnRef, setTxnRef] = useState('');
  const [paymentMsg, setPaymentMsg] = useState<{ success: boolean; text: string } | null>(null);

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
    } catch (e) {
      console.warn('API fetch fallback:', e);
      // Fallback sample question for immediate offline visual verification
      setQuestions([
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
      ]);
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
      }
    } catch {
      // Offline fallback evaluation
      const isCorrect = selectedOptionId === 'opt-01';
      setEvaluation({
        isCorrect,
        correctOptionId: 'opt-01',
        explanation: 'Evidence obtained directly by the auditor through independent physical inspection or direct external confirmations from third parties provides the highest level of reliability.',
        referenceSource: 'ISA 500 (Audit Evidence)',
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

  const loginDemoStudent = () => {
    setAuthEmail('student@exitprep.et');
    setAuthPassword('ExitPrep@2026!');
    setAuthMode('login');
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Notice: Content Integrity Decision */}
      <div className="bg-emerald-950 text-emerald-200 text-xs px-4 py-2 border-b border-emerald-800/50 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            ExitPrep Ethiopia MVP Blueprint — Official Ministry of Education & COC Standards Grounded
          </span>
          <span className="hidden md:inline text-emerald-300/80">Local Dev Server: Port 5173</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* Logo & Ethiopian Flag Pill */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-slate-900 flex items-center justify-center shadow-md shadow-emerald-700/20 text-white font-bold text-xl">
              EP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg">ExitPrep</span>
                <span className="text-xs font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Ethiopia 🇪🇹
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">University Exit & COC Exam Hub</p>
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
          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('profile')}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-sm font-medium hover:bg-slate-100 transition-colors"
                >
                  <User className="w-4 h-4 text-emerald-600" />
                  <span className="hidden sm:inline">{user.fullName.split(' ')[0]}</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold">
                    {user.role}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setUser(null);
                    setToken(null);
                  }}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setShowAuthModal(true);
                  }}
                  className="px-3.5 py-1.5 text-sm font-semibold text-slate-700 hover:text-emerald-700 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setShowAuthModal(true);
                  }}
                  className="px-4 py-2 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition-all active:scale-95"
                >
                  Join Free
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            <button
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Overview
            </button>
            <button
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Exam Pathways
            </button>
            <button
              onClick={() => {
                setActiveTab('practice');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Free Practice
            </button>
            <button
              onClick={() => {
                setActiveTab('pricing');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
            >
              Subscriptions (CBE / Telebirr)
            </button>
          </div>
        )}
      </header>

      {/* Content Body */}
      <main className="flex-1 pb-20 md:pb-12">
        {activeTab === 'home' && (
          <div>
            {/* Hero Section */}
            <section className="bg-gradient-to-b from-emerald-50/70 via-white to-slate-50 py-12 md:py-16 px-4 border-b border-slate-200">
              <div className="max-w-4xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6">
                  <Sparkles className="w-3.5 h-3.5" />
                  National University Exit & COC Exam Engine
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight md:leading-tight mb-5">
                  Prepare for Ethiopia’s National{' '}
                  <span className="text-emerald-700 underline decoration-amber-400 decoration-wavy underline-offset-8">
                    Exit & COC Exams
                  </span>
                </h1>
                <p className="text-base md:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto mb-8">
                  Mobile-first assessment platform tailored for Ethiopian university graduates and TVET candidates.
                  Practice verified questions, take server-timed mock exams, and review official benchmark explanations.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('practice')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-700/20 flex items-center justify-center gap-2 transition-transform active:scale-95"
                  >
                    <span>Start Free Practice Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setActiveTab('catalog')}
                    className="w-full sm:w-auto px-6 py-3.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold rounded-xl transition-colors"
                  >
                    Explore Departments & Blueprint
                  </button>
                </div>

                {!user && (
                  <div className="mt-8 pt-6 border-t border-slate-200/60 flex items-center justify-center gap-2 text-xs text-slate-500">
                    <span>Quick test mode:</span>
                    <button
                      onClick={loginDemoStudent}
                      className="text-emerald-700 font-semibold underline hover:text-emerald-800"
                    >
                      Login as Demo Student
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* Dual Pathways Grid */}
            <section className="max-w-7xl mx-auto px-4 py-12">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Dual Preparation Pathways</h2>
                <p className="text-sm md:text-base text-slate-600">
                  Shared exam engine catering to academic degrees and certified vocational qualifications.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                {/* Pathway 1: University Exit Exam */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded bg-emerald-50 text-emerald-700 text-xs font-bold mb-2">
                      MoE University Mandate
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">University Exit Exam</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
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
                      className="text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1.5"
                    >
                      <span>View University Programs</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Pathway 2: COC Competency Exam */}
                <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-110"></div>
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="inline-block px-2.5 py-0.5 rounded bg-amber-50 text-amber-800 text-xs font-bold mb-2">
                      Center of Competence (COC)
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-3">COC Competency Assessment</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-6">
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
                      className="text-sm font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1.5"
                    >
                      <span>Inspect COC Qualification Blueprint</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* Core Features */}
            <section className="bg-slate-100/70 py-12 px-4 border-t border-slate-200">
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-10">
                  <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Built for the Ethiopian Student Experience</h2>
                  <p className="text-sm text-slate-600">Engineered for mobile browsers, low data consumption, and local payment workflows.</p>
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center mb-3">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Strict Content Rule</h4>
                    <p className="text-xs text-slate-600">
                      No invented curricula or unofficial questions. Every question is reviewed by academic reviewers with verified citations.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center mb-3">
                      <Clock className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Server-Enforced Timing</h4>
                    <p className="text-xs text-slate-600">
                      Mock exam attempts calculate duration on the backend, safeguarding against client clock manipulation.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center mb-3">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">CBE & Telebirr Verification</h4>
                    <p className="text-xs text-slate-600">
                      Deposit via CBE or transfer via Telebirr. Submit your transaction code for quick administrative verification.
                    </p>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center mb-3">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mb-1">Department Specialization</h4>
                    <p className="text-xs text-slate-600">
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
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="mb-8">
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-2">Program Catalog & Blueprints</h1>
              <p className="text-sm text-slate-600">
                Explore supported university business curricula and occupational qualifications.
              </p>
            </div>

            <div className="space-y-6">
              {/* Category 1 */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <BookOpen className="w-5 h-5 text-emerald-700" />
                  <h2 className="text-lg font-bold text-slate-900">University Exit Examination (Business Programs)</h2>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">Accounting and Finance</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BSc / BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                      Core focus: Auditing & Assurance, Financial Accounting I-III, Cost & Managerial Accounting, Ethiopian Taxation Law, and Corporate Finance.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">Management</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                      Core focus: Strategic Management, Operations Management, Organizational Behavior, Project Management, and Business Research Methods.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">Economics</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BSc / BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                      Core focus: Microeconomics, Macroeconomics, Introduction to Econometrics, Development Economics, and Ethiopian Economic Structure.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-bold text-slate-900">Marketing Management</h3>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        BA
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mb-4">
                      Core focus: Consumer Behavior, Strategic Marketing, Sales Management, Marketing Communications, and International Marketing.
                    </p>
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                      <span>Verified Questions: Available</span>
                      <button
                        onClick={() => setActiveTab('practice')}
                        className="text-emerald-700 font-bold hover:underline"
                      >
                        Practice Now →
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category 2 */}
              <div className="pt-6 border-t border-slate-200">
                <div className="flex items-center gap-2 mb-4">
                  <Award className="w-5 h-5 text-amber-700" />
                  <h2 className="text-lg font-bold text-slate-900">COC Occupational Competency Catalog</h2>
                </div>

                <div className="bg-amber-50/60 rounded-xl p-5 border border-amber-200/80">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">Accounts & Budget Service</h3>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                          Level IV (Configurable)
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mb-3 max-w-2xl">
                        Awaiting official occupational standards verification. Per product rule, competency units and mock assessments remain unpublished until verified with qualified assessors.
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded">
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
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Free Practice Engine</span>
                <h1 className="text-2xl font-extrabold text-slate-900">Sample Exit Exam Questions</h1>
              </div>
              <button
                onClick={fetchQuestions}
                className="p-2 text-slate-600 hover:text-emerald-700 rounded-lg hover:bg-slate-100 transition-colors"
                title="Reload Questions"
              >
                <RefreshCw className={`w-4 h-4 ${loadingQuestions ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {questions.length > 0 ? (
              <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-4">
                  <span>
                    Question {currentQIndex + 1} of {questions.length}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold uppercase">
                    {questions[currentQIndex].difficulty}
                  </span>
                </div>

                {/* Question Stem */}
                <h2 className="text-base md:text-lg font-bold text-slate-900 leading-relaxed mb-6">
                  {questions[currentQIndex].stem}
                </h2>

                {/* Options List */}
                <div className="space-y-3 mb-6">
                  {questions[currentQIndex].options.map((opt) => {
                    const isSelected = selectedOptionId === opt.id;
                    const isEvaluated = evaluation !== null;
                    const isCorrectOption = evaluation?.correctOptionId === opt.id;
                    const isSelectedWrong = isEvaluated && isSelected && !evaluation.isCorrect;

                    let optClasses = 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 text-slate-800';

                    if (isSelected && !isEvaluated) {
                      optClasses = 'border-emerald-600 bg-emerald-50/50 text-emerald-900 ring-2 ring-emerald-500/20';
                    } else if (isEvaluated) {
                      if (isCorrectOption) {
                        optClasses = 'border-emerald-600 bg-emerald-50 text-emerald-950 font-semibold';
                      } else if (isSelectedWrong) {
                        optClasses = 'border-rose-500 bg-rose-50 text-rose-950';
                      } else {
                        optClasses = 'border-slate-200 bg-slate-50/50 text-slate-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={opt.id}
                        disabled={isEvaluated}
                        onClick={() => setSelectedOptionId(opt.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all text-sm leading-normal flex items-start gap-3 ${optClasses}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                            isSelected
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {String.fromCharCode(65 + opt.orderIndex)}
                        </span>
                        <span className="flex-1 pt-0.5">{opt.text}</span>
                        {isEvaluated && isCorrectOption && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {isEvaluated && isSelectedWrong && (
                          <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
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
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition-all active:scale-95"
                  >
                    Check Answer
                  </button>
                ) : (
                  <div className="space-y-4">
                    {/* Explanation Box */}
                    <div
                      className={`p-4 rounded-xl border ${
                        evaluation.isCorrect
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-bold text-sm mb-1">
                        {evaluation.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Correct!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Incorrect</span>
                          </>
                        )}
                      </div>
                      <p className="text-xs leading-relaxed mb-2">{evaluation.explanation}</p>
                      {evaluation.referenceSource && (
                        <div className="text-[11px] font-semibold text-slate-600 pt-2 border-t border-slate-200/50 flex items-center gap-1">
                          <span>Benchmark Source:</span>
                          <span className="italic">{evaluation.referenceSource}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const nextIdx = (currentQIndex + 1) % questions.length;
                        setCurrentQIndex(nextIdx);
                        setSelectedOptionId(null);
                        setEvaluation(null);
                      }}
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition-all"
                    >
                      Next Question →
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 p-8">
                <p className="text-slate-600 text-sm mb-4">No verified practice questions loaded yet.</p>
                <button
                  onClick={fetchQuestions}
                  className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                >
                  Reload Questions
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab: Subscriptions & Payment Submission */}
        {activeTab === 'pricing' && (
          <div className="max-w-5xl mx-auto px-4 py-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Affordable Access</span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">
                Free Practice + Paid Subscriptions
              </h1>
              <p className="text-sm text-slate-600">
                Practice verified sample questions for free. Upgrade to unlock full-length timed mock exams with manual CBE
                or Telebirr verification.
              </p>
            </div>

            {/* Plans Cards */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Free Tier */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Free Practice Tier</h3>
                  <p className="text-xs text-slate-500 mb-4">Essential preparation starter</p>
                  <div className="text-3xl font-extrabold text-slate-900 mb-4">
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
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-colors"
                >
                  Practice Free
                </button>
              </div>

              {/* Monthly Plan */}
              <div className="bg-white rounded-2xl p-6 border-2 border-emerald-600 shadow-md relative flex flex-col justify-between">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] uppercase font-bold tracking-wider px-3 py-0.5 rounded-full shadow-sm">
                  Most Popular
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Standard Monthly</h3>
                  <p className="text-xs text-slate-500 mb-4">Full question bank access</p>
                  <div className="text-3xl font-extrabold text-slate-900 mb-4">
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
                  onClick={() => {
                    setSelectedPlanId('plan-std-02');
                    window.scrollTo({ top: 800, behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-colors"
                >
                  Select Monthly Pass
                </button>
              </div>

              {/* Semester Pass */}
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg mb-1">Premium Semester</h3>
                  <p className="text-xs text-slate-500 mb-4">Graduation exam pass guarantee</p>
                  <div className="text-3xl font-extrabold text-slate-900 mb-4">
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
                  onClick={() => {
                    setSelectedPlanId('plan-prem-03');
                    window.scrollTo({ top: 800, behavior: 'smooth' });
                  }}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Select Semester Pass
                </button>
              </div>
            </div>

            {/* Manual Payment Submission Form */}
            <div className="bg-white rounded-2xl p-6 md:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto">
              <h2 className="text-lg font-bold text-slate-900 mb-1">Submit Payment Slip (CBE / Telebirr)</h2>
              <p className="text-xs text-slate-600 mb-6">
                Transfer the subscription fee using either Commercial Bank of Ethiopia (CBE) or Telebirr, then input your
                transaction reference code below for admin verification.
              </p>

              {/* Bank Details Card */}
              <div className="grid sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 mb-6 text-xs text-slate-700">
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Commercial Bank of Ethiopia (CBE):</span>
                  <span>Account: </span>
                  <span className="font-mono font-bold text-emerald-800">1000234567891</span>
                  <br />
                  <span className="text-[11px] text-slate-500">Name: ExitPrep Ethiopia Ltd</span>
                </div>
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Telebirr Merchant Pay:</span>
                  <span>Pay Code: </span>
                  <span className="font-mono font-bold text-emerald-800">882200</span>
                  <br />
                  <span className="text-[11px] text-slate-500">Phone: 0911-223344</span>
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
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
                  >
                    <option value="plan-std-02">Standard Monthly — ETB 150</option>
                    <option value="plan-prem-03">Premium Semester — ETB 350</option>
                  </select>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                    <select
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white font-medium"
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
                      className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono uppercase"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition-all active:scale-95"
                >
                  Submit Payment for Verification
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab: Profile */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto px-4 py-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-6">Student Account</h1>

            {user ? (
              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                    {user.fullName[0]}
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900 text-lg">{user.fullName}</h2>
                    <p className="text-xs text-slate-500">{user.email}</p>
                    <span className="inline-block mt-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
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
                  className="w-full py-2.5 border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-6">
                <User className="w-10 h-10 text-slate-400 mx-auto mb-3" />
                <h3 className="font-bold text-slate-900 mb-1">Sign in to view your profile</h3>
                <p className="text-xs text-slate-500 mb-4">Track mock exam progress and manage subscriptions.</p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-6 py-2.5 bg-emerald-600 text-white font-bold rounded-xl text-xs"
                >
                  Sign In / Register
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 max-w-sm w-full border border-slate-200 shadow-2xl relative">
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <h2 className="text-xl font-extrabold text-slate-900">
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
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
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
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs shadow-md transition-all mt-2"
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
                    className="text-emerald-700 font-bold hover:underline"
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
                    className="text-emerald-700 font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-t border-slate-200 h-16 flex items-center justify-around px-2">
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'home' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Home</span>
        </button>
        <button
          onClick={() => setActiveTab('catalog')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'catalog' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Catalog</span>
        </button>
        <button
          onClick={() => setActiveTab('practice')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'practice' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Practice</span>
        </button>
        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'pricing' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Plans</span>
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 text-[11px] font-bold ${
            activeTab === 'profile' ? 'text-emerald-700' : 'text-slate-500'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Account</span>
        </button>
      </nav>
    </div>
  );
}

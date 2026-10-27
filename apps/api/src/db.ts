import bcrypt from 'bcryptjs';
import {
  UserRole,
  ExamCategoryType,
  QuestionStatus,
  DifficultyLevel,
  SubscriptionTier,
  SubscriptionStatus,
  PaymentMethod,
  PaymentStatus,
  AttemptStatus,
} from '@exitprep/shared';

// In-Memory Fallback State
export interface MemoryUser {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  passwordHash: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryCategory {
  id: string;
  code: ExamCategoryType;
  name: string;
  description: string;
  isActive: boolean;
}

export interface MemoryProgram {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  level: string;
  description: string;
  isConfigurable: boolean;
  isActive: boolean;
}

export interface MemoryQuestionOption {
  id: string;
  questionId: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
  explanation?: string;
}

export interface MemoryQuestion {
  id: string;
  topicId: string;
  programId: string;
  stem: string;
  explanation: string;
  referenceSource?: string;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  isPublished: boolean;
  authorId?: string;
  reviewerId?: string;
  rejectionReason?: string;
  createdAt: string;
  options: MemoryQuestionOption[];
}

export interface MemoryExam {
  id: string;
  programId: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScorePercent: number;
  totalQuestions: number;
  isPublished: boolean;
  questionIds: string[];
}

export interface MemoryExamAttempt {
  id: string;
  userId: string;
  examId: string;
  status: AttemptStatus;
  scorePercent?: number;
  totalCorrect?: number;
  totalQuestions: number;
  timeSpentSeconds: number;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  answers: { questionId: string; selectedOptionId: string; isCorrect: boolean }[];
}

export interface MemorySubscriptionPlan {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceETB: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

export interface MemorySubscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
}

export interface MemoryPaymentReceipt {
  id: string;
  userId: string;
  subscriptionId?: string;
  bankName: PaymentMethod;
  transactionRef: string;
  amountETB: number;
  receiptImageUrl?: string;
  notes?: string;
  status: PaymentStatus;
  verifiedById?: string;
  verifiedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface MemoryAuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  performedById?: string;
  details?: any;
  createdAt: string;
}

class InMemoryStore {
  users: MemoryUser[] = [];
  categories: MemoryCategory[] = [];
  programs: MemoryProgram[] = [];
  questions: MemoryQuestion[] = [];
  exams: MemoryExam[] = [];
  attempts: MemoryExamAttempt[] = [];
  plans: MemorySubscriptionPlan[] = [];
  subscriptions: MemorySubscription[] = [];
  receipts: MemoryPaymentReceipt[] = [];
  auditLogs: MemoryAuditLog[] = [];

  constructor() {
    this.seedDefaults();
  }

  private seedDefaults() {
    const salt = bcrypt.genSaltSync(10);
    const defaultHash = bcrypt.hashSync('ExitPrep@2026!', salt);
    const adminHash = bcrypt.hashSync('Admin@ExitPrep2026!', salt);

    // Users
    this.users = [
      {
        id: 'usr-admin-01',
        email: 'admin@exitprep.et',
        fullName: 'Dr. Abebe Bekele (Super Admin)',
        phone: '+251911223344',
        passwordHash: adminHash,
        role: UserRole.SUPER_ADMINISTRATOR,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-fin-02',
        email: 'finance@exitprep.et',
        fullName: 'Tigist Haile (Payment Administrator)',
        phone: '+251922334455',
        passwordHash: defaultHash,
        role: UserRole.PAYMENT_ADMINISTRATOR,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-rev-03',
        email: 'reviewer@exitprep.et',
        fullName: 'Dr. Dawit Tadesse (Academic Reviewer)',
        phone: '+251933445566',
        passwordHash: defaultHash,
        role: UserRole.REVIEWER,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-edit-04',
        email: 'editor@exitprep.et',
        fullName: 'Selamawit Girma (Content Editor)',
        phone: '+251944556677',
        passwordHash: defaultHash,
        role: UserRole.CONTENT_EDITOR,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'usr-stud-05',
        email: 'student@exitprep.et',
        fullName: 'Kidus Yohannes (Graduating Student)',
        phone: '+251955667788',
        passwordHash: defaultHash,
        role: UserRole.STUDENT,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Categories
    this.categories = [
      {
        id: 'cat-exit-exam-01',
        code: ExamCategoryType.UNIVERSITY_EXIT_EXAM,
        name: 'University Exit Examination',
        description: 'Standardized national exit exam mandated by the Ministry of Education (MoE) for graduating students across higher education institutions in Ethiopia.',
        isActive: true,
      },
      {
        id: 'cat-coc-exam-02',
        code: ExamCategoryType.COC_COMPETENCY_EXAM,
        name: 'Occupational Competency Assessment (COC)',
        description: 'Center of Competence assessment evaluating practical competencies and occupational standards across certified qualification levels.',
        isActive: true,
      },
    ];

    // Programs
    this.programs = [
      {
        id: 'prog-accfin-01',
        categoryId: 'cat-exit-exam-01',
        name: 'Accounting and Finance',
        code: 'ACCFIN',
        level: 'BSc / BA',
        description: 'Curriculum blueprint covering financial accounting, audit, Ethiopian tax law, cost accounting, and public financial management.',
        isConfigurable: false,
        isActive: true,
      },
      {
        id: 'prog-mgmt-02',
        categoryId: 'cat-exit-exam-01',
        name: 'Management',
        code: 'MGMT',
        level: 'BA',
        description: 'Undergraduate business management blueprint covering organizational behavior, operations, strategic management, and project management.',
        isConfigurable: false,
        isActive: true,
      },
      {
        id: 'prog-econ-03',
        categoryId: 'cat-exit-exam-01',
        name: 'Economics',
        code: 'ECON',
        level: 'BSc / BA',
        description: 'Blueprint covering microeconomics, macroeconomics, Ethiopian economy, econometrics, and monetary theory.',
        isConfigurable: false,
        isActive: true,
      },
      {
        id: 'prog-mktg-04',
        categoryId: 'cat-exit-exam-01',
        name: 'Marketing Management',
        code: 'MKTG',
        level: 'BA',
        description: 'Blueprint covering marketing research, brand management, consumer behavior, and sales management.',
        isConfigurable: false,
        isActive: true,
      },
      {
        id: 'prog-coc-acc-05',
        categoryId: 'cat-coc-exam-02',
        name: 'Accounts & Budget Service / Level IV',
        code: 'COC-ACCFIN-L4',
        level: 'Level IV',
        description: 'Configurable occupational qualification catalog entry. Units and occupational standards remain unpublished pending official verification.',
        isConfigurable: true,
        isActive: true,
      },
    ];

    // Verified Questions
    this.questions = [
      {
        id: 'q-sample-acc-01',
        topicId: 'top-acc-01',
        programId: 'prog-accfin-01',
        stem: 'Which of the following forms of audit evidence is generally considered the most reliable by an independent auditor during a financial statement audit?',
        explanation: 'Evidence obtained directly by the auditor through independent physical inspection or direct external confirmations from third parties (e.g., bank confirmations under ISA 500) provides the highest level of reliability compared to internal documentation.',
        referenceSource: 'Ethiopian Higher Education Exit Exam Blueprint / ISA 500 - Audit Evidence',
        difficulty: DifficultyLevel.INTERMEDIATE,
        status: QuestionStatus.VERIFIED,
        isPublished: true,
        authorId: 'usr-edit-04',
        reviewerId: 'usr-rev-03',
        createdAt: new Date().toISOString(),
        options: [
          {
            id: 'opt-01',
            questionId: 'q-sample-acc-01',
            text: 'Direct confirmation sent to the auditor from an independent financial institution.',
            isCorrect: true,
            orderIndex: 0,
            explanation: 'External confirmations from knowledgeable independent parties offer superior evidentiary value.',
          },
          {
            id: 'opt-02',
            questionId: 'q-sample-acc-01',
            text: 'Internally generated sales invoice copies stored in the client filing department.',
            isCorrect: false,
            orderIndex: 1,
            explanation: 'Internal documentation carries risk of client bias, error, or management override.',
          },
          {
            id: 'opt-03',
            questionId: 'q-sample-acc-01',
            text: 'Oral representations obtained from the company managing director during inquiries.',
            isCorrect: false,
            orderIndex: 2,
            explanation: 'Oral representations alone do not constitute sufficient corroborative evidence.',
          },
          {
            id: 'opt-04',
            questionId: 'q-sample-acc-01',
            text: 'Client-prepared quarterly bank reconciliation summary sheets.',
            isCorrect: false,
            orderIndex: 3,
            explanation: 'Client-prepared worksheets require external corroboration with bank statements.',
          },
        ],
      },
      {
        id: 'q-sample-acc-02',
        topicId: 'top-acc-02',
        programId: 'prog-accfin-01',
        stem: 'Under Ethiopian Tax Law (Federal Income Tax Proclamation No. 979/2016), which of the following categories of taxpayers is designated as Category "A"?',
        explanation: 'According to Proclamation No. 979/2016, Category "A" taxpayers are incorporated bodies (companies) or individuals having an annual gross turnover of ETB 2,000,000 or more, and are legally required to maintain double-entry books of accounts.',
        referenceSource: 'Federal Income Tax Proclamation No. 979/2016, Art. 18 / MoE Tax Curriculum',
        difficulty: DifficultyLevel.INTERMEDIATE,
        status: QuestionStatus.VERIFIED,
        isPublished: true,
        authorId: 'usr-edit-04',
        reviewerId: 'usr-rev-03',
        createdAt: new Date().toISOString(),
        options: [
          {
            id: 'opt-05',
            questionId: 'q-sample-acc-02',
            text: 'Any corporate entity or sole proprietorship with annual turnover of ETB 2,000,000 or higher.',
            isCorrect: true,
            orderIndex: 0,
            explanation: 'Proclamation 979/2016 mandates double-entry accounting records for this turnover threshold.',
          },
          {
            id: 'opt-06',
            questionId: 'q-sample-acc-02',
            text: 'Sole proprietorships with annual turnover between ETB 500,000 and ETB 1,000,000.',
            isCorrect: false,
            orderIndex: 1,
            explanation: 'This threshold corresponds to Category B taxpayers.',
          },
          {
            id: 'opt-07',
            questionId: 'q-sample-acc-02',
            text: 'Micro-enterprises with annual turnover under ETB 100,000.',
            isCorrect: false,
            orderIndex: 2,
            explanation: 'Turnover under ETB 500,000 falls under Category C standard assessment.',
          },
          {
            id: 'opt-08',
            questionId: 'q-sample-acc-02',
            text: 'Only public state-owned enterprises regardless of turnover.',
            isCorrect: false,
            orderIndex: 3,
            explanation: 'Categorization is primarily determined by legal structure and revenue thresholds.',
          },
        ],
      },
      {
        id: 'q-sample-mgmt-01',
        topicId: 'top-mgmt-01',
        programId: 'prog-mgmt-02',
        stem: 'In strategic management, Michael Porter’s Five Forces Framework is primarily used to analyze:',
        explanation: 'Porter’s Five Forces Framework analyzes the competitive intensity, attractiveness, and long-term profitability potential of an entire industry sector.',
        referenceSource: 'Higher Education Management Curriculum / Competitive Strategy (M. Porter)',
        difficulty: DifficultyLevel.BEGINNER,
        status: QuestionStatus.VERIFIED,
        isPublished: true,
        authorId: 'usr-edit-04',
        reviewerId: 'usr-rev-03',
        createdAt: new Date().toISOString(),
        options: [
          {
            id: 'opt-09',
            questionId: 'q-sample-mgmt-01',
            text: 'The structural attractiveness and competitive intensity of an industry.',
            isCorrect: true,
            orderIndex: 0,
            explanation: 'It evaluates buyers, suppliers, substitutes, entrants, and rivalry.',
          },
          {
            id: 'opt-10',
            questionId: 'q-sample-mgmt-01',
            text: 'Internal employee performance appraisals and compensation bands.',
            isCorrect: false,
            orderIndex: 1,
            explanation: 'Internal HR systems are evaluated via VRIO or internal audit frameworks.',
          },
          {
            id: 'opt-11',
            questionId: 'q-sample-mgmt-01',
            text: 'Macro-environmental demographic trends exclusively.',
            isCorrect: false,
            orderIndex: 2,
            explanation: 'Demographic trends fall under PESTLE analysis.',
          },
          {
            id: 'opt-12',
            questionId: 'q-sample-mgmt-01',
            text: 'Daily working capital liquidity and cash flow cycles.',
            isCorrect: false,
            orderIndex: 3,
            explanation: 'Cash flows are examined using financial statement analysis.',
          },
        ],
      },
    ];

    // Mock Exams
    this.exams = [
      {
        id: 'exam-accfin-mock-01',
        programId: 'prog-accfin-01',
        title: 'National Exit Exam Simulation: Accounting & Finance Comprehensive Mock',
        description: 'Timed full-length mock assessment structured following the Ministry of Education exit exam blueprint distribution.',
        durationMinutes: 120,
        passingScorePercent: 50.0,
        totalQuestions: 100,
        isPublished: true,
        questionIds: ['q-sample-acc-01', 'q-sample-acc-02'],
      },
      {
        id: 'exam-mgmt-mock-02',
        programId: 'prog-mgmt-02',
        title: 'National Exit Exam Simulation: Management Comprehensive Mock',
        description: 'Timed simulation evaluating core competencies in management, organizational strategy, and operational leadership.',
        durationMinutes: 120,
        passingScorePercent: 50.0,
        totalQuestions: 100,
        isPublished: true,
        questionIds: ['q-sample-mgmt-01'],
      },
    ];

    // Subscription Plans
    this.plans = [
      {
        id: 'plan-free-01',
        name: 'Free Practice Tier',
        tier: SubscriptionTier.FREE,
        priceETB: 0.0,
        durationDays: 365,
        features: ['Verified sample practice questions', 'Instant answer explanations', 'Public discussion insights'],
        isActive: true,
      },
      {
        id: 'plan-std-02',
        name: 'Standard Monthly Pass',
        tier: SubscriptionTier.STANDARD_MONTHLY,
        priceETB: 150.0,
        durationDays: 30,
        features: ['Full access to all verified university questions', 'Unlimited practice mode attempts', 'Topic-by-topic performance metrics', 'Official citation references'],
        isActive: true,
      },
      {
        id: 'plan-prem-03',
        name: 'Premium Semester Pass',
        tier: SubscriptionTier.PREMIUM_SEMESTER,
        priceETB: 350.0,
        durationDays: 120,
        features: ['Full question bank access', 'Unlimited server-timed MoE blueprint mock exams', 'Priority manual payment verification (CBE & Telebirr)', 'Targeted revision guides for weak topics', 'Pass guarantee support & mock certificates'],
        isActive: true,
      },
    ];

    // Seed Receipts
    this.receipts = [
      {
        id: 'rcpt-01',
        userId: 'usr-stud-05',
        bankName: PaymentMethod.TELEBIRR,
        transactionRef: 'FT26298ABCD1234',
        amountETB: 150.0,
        notes: 'Monthly pass paid via Telebirr app',
        status: PaymentStatus.SUBMITTED,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
    ];

    // Audit Log
    this.auditLogs = [
      {
        id: 'audit-01',
        action: 'SYSTEM_BOOTSTRAP',
        entity: 'System',
        entityId: 'exitprep-core',
        performedById: 'usr-admin-01',
        details: { message: 'Initialized ExitPrep Ethiopia MVP system and catalog' },
        createdAt: new Date().toISOString(),
      },
    ];
  }
}

export const dbStore = new InMemoryStore();

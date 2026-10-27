/**
 * ExitPrep Ethiopia — Shared Types & Enums
 */

// User Roles
export enum UserRole {
  STUDENT = 'STUDENT',
  CONTENT_EDITOR = 'CONTENT_EDITOR',
  REVIEWER = 'REVIEWER',
  PAYMENT_ADMINISTRATOR = 'PAYMENT_ADMINISTRATOR',
  SUPER_ADMINISTRATOR = 'SUPER_ADMINISTRATOR',
}

// Exam Pathway Categories
export enum ExamCategoryType {
  UNIVERSITY_EXIT_EXAM = 'UNIVERSITY_EXIT_EXAM',
  COC_COMPETENCY_EXAM = 'COC_COMPETENCY_EXAM',
}

// Question Status Lifecycle
export enum QuestionStatus {
  DRAFT = 'DRAFT',
  PENDING_REVIEW = 'PENDING_REVIEW',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// Question Difficulty
export enum DifficultyLevel {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
}

// Exam Attempt Status
export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  EXPIRED = 'EXPIRED',
  ABANDONED = 'ABANDONED',
}

// Subscription Tiers
export enum SubscriptionTier {
  FREE = 'FREE',
  STANDARD_MONTHLY = 'STANDARD_MONTHLY',
  PREMIUM_SEMESTER = 'PREMIUM_SEMESTER',
}

// Subscription Status
export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  CANCELLED = 'CANCELLED',
}

// Supported Ethiopian Payment Methods
export enum PaymentMethod {
  CBE = 'CBE', // Commercial Bank of Ethiopia
  TELEBIRR = 'TELEBIRR',
  BOA = 'BOA', // Bank of Abyssinia
  AWASH = 'AWASH', // Awash Bank
}

// Payment Verification Status
export enum PaymentStatus {
  SUBMITTED = 'SUBMITTED',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
}

// DTOs & Interfaces
export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponseDto {
  user: UserProfileDto;
  tokens: AuthTokens;
  activeSubscription?: SubscriptionDto;
}

export interface ExamCategoryDto {
  id: string;
  code: ExamCategoryType;
  name: string;
  description: string;
  isActive: boolean;
  programCount?: number;
}

export interface ProgramDto {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  level: string; // e.g. "BSc / BA", "Level IV", "Level V"
  description: string;
  isConfigurable: boolean;
  isActive: boolean;
  courseCount?: number;
  questionCount?: number;
}

export interface CourseDto {
  id: string;
  programId: string;
  name: string;
  code: string;
  description?: string;
  orderIndex: number;
}

export interface TopicDto {
  id: string;
  courseId: string;
  name: string;
  code?: string;
  description?: string;
}

export interface QuestionOptionDto {
  id: string;
  text: string;
  orderIndex: number;
  isCorrect?: boolean; // Stripped for students during active practice/exam
  explanation?: string;
}

export interface QuestionDto {
  id: string;
  topicId: string;
  stem: string;
  explanation: string;
  referenceSource?: string;
  difficulty: DifficultyLevel;
  status: QuestionStatus;
  isPublished: boolean;
  options: QuestionOptionDto[];
  topicName?: string;
  courseName?: string;
  programName?: string;
}

export interface AnswerSubmissionDto {
  questionId: string;
  selectedOptionId: string;
}

export interface AnswerEvaluationDto {
  questionId: string;
  selectedOptionId: string;
  isCorrect: boolean;
  correctOptionId: string;
  explanation: string;
  referenceSource?: string;
}

export interface MockExamDto {
  id: string;
  programId: string;
  title: string;
  description: string;
  durationMinutes: number;
  passingScorePercent: number;
  totalQuestions: number;
  isPublished: boolean;
  programName?: string;
}

export interface ExamAttemptDto {
  id: string;
  examId: string;
  userId: string;
  status: AttemptStatus;
  scorePercent?: number;
  totalCorrect?: number;
  totalQuestions: number;
  startedAt: string;
  expiresAt: string;
  submittedAt?: string;
  timeSpentSeconds?: number;
}

export interface ExamResultDto {
  attempt: ExamAttemptDto;
  passed: boolean;
  passingScorePercent: number;
  questions: {
    question: QuestionDto;
    selectedOptionId?: string;
    isCorrect: boolean;
  }[];
}

export interface SubscriptionPlanDto {
  id: string;
  name: string;
  tier: SubscriptionTier;
  priceETB: number;
  durationDays: number;
  features: string[];
  isActive: boolean;
}

export interface SubscriptionDto {
  id: string;
  userId: string;
  planId: string;
  planName?: string;
  tier?: SubscriptionTier;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
}

export interface PaymentReceiptDto {
  id: string;
  userId: string;
  subscriptionId?: string;
  userName?: string;
  userEmail?: string;
  bankName: PaymentMethod;
  transactionRef: string;
  amountETB: number;
  receiptImageUrl?: string;
  notes?: string;
  status: PaymentStatus;
  verifiedByName?: string;
  verifiedAt?: string;
  adminNotes?: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

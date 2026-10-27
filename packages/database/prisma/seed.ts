import { PrismaClient, UserRole, ExamCategoryType, SubscriptionTier, QuestionStatus, DifficultyLevel, PaymentMethod, PaymentStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding ExitPrep Ethiopia database...');

  // 1. Password Hashes
  const defaultPassword = await bcrypt.hash('ExitPrep@2026!', 10);
  const adminPassword = await bcrypt.hash('Admin@ExitPrep2026!', 10);

  // 2. Seed Users across all 5 roles
  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@exitprep.et' },
    update: {},
    create: {
      email: 'admin@exitprep.et',
      fullName: 'Dr. Abebe Bekele (Super Admin)',
      phone: '+251911223344',
      passwordHash: adminPassword,
      role: UserRole.SUPER_ADMINISTRATOR,
      isActive: true,
    },
  });

  const paymentAdmin = await prisma.user.upsert({
    where: { email: 'finance@exitprep.et' },
    update: {},
    create: {
      email: 'finance@exitprep.et',
      fullName: 'Tigist Haile (Payment Officer)',
      phone: '+251922334455',
      passwordHash: defaultPassword,
      role: UserRole.PAYMENT_ADMINISTRATOR,
      isActive: true,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@exitprep.et' },
    update: {},
    create: {
      email: 'reviewer@exitprep.et',
      fullName: 'Dr. Dawit Tadesse (Academic Reviewer)',
      phone: '+251933445566',
      passwordHash: defaultPassword,
      role: UserRole.REVIEWER,
      isActive: true,
    },
  });

  const contentEditor = await prisma.user.upsert({
    where: { email: 'editor@exitprep.et' },
    update: {},
    create: {
      email: 'editor@exitprep.et',
      fullName: 'Selamawit Girma (Content Editor)',
      phone: '+251944556677',
      passwordHash: defaultPassword,
      role: UserRole.CONTENT_EDITOR,
      isActive: true,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@exitprep.et' },
    update: {},
    create: {
      email: 'student@exitprep.et',
      fullName: 'Kidus Yohannes (Graduating Student)',
      phone: '+251955667788',
      passwordHash: defaultPassword,
      role: UserRole.STUDENT,
      isActive: true,
    },
  });

  console.log('Seeded Users: SuperAdmin, PaymentAdmin, Reviewer, ContentEditor, Student');

  // 3. Exam Categories
  const exitCategory = await prisma.examCategory.upsert({
    where: { code: ExamCategoryType.UNIVERSITY_EXIT_EXAM },
    update: {},
    create: {
      id: 'cat-exit-exam-01',
      code: ExamCategoryType.UNIVERSITY_EXIT_EXAM,
      name: 'University Exit Examination',
      description: 'Standardized assessment mandated by the Ministry of Education (MoE) for graduating students across higher education institutions in Ethiopia.',
      isActive: true,
    },
  });

  const cocCategory = await prisma.examCategory.upsert({
    where: { code: ExamCategoryType.COC_COMPETENCY_EXAM },
    update: {},
    create: {
      id: 'cat-coc-exam-02',
      code: ExamCategoryType.COC_COMPETENCY_EXAM,
      name: 'Occupational Competency Assessment (COC)',
      description: 'Center of Competence assessment evaluating practical competencies and occupational standards across certified qualification levels.',
      isActive: true,
    },
  });

  // 4. University Exit Exam Business Programs
  const accProg = await prisma.program.upsert({
    where: { code: 'ACCFIN' },
    update: {},
    create: {
      categoryId: exitCategory.id,
      name: 'Accounting and Finance',
      code: 'ACCFIN',
      level: 'BSc / BA',
      description: 'Undergraduate business curriculum covering financial accounting, audit, taxation, cost accounting, and public finance.',
      isConfigurable: false,
      isActive: true,
    },
  });

  const mgmtProg = await prisma.program.upsert({
    where: { code: 'MGMT' },
    update: {},
    create: {
      categoryId: exitCategory.id,
      name: 'Management',
      code: 'MGMT',
      level: 'BA',
      description: 'Undergraduate business management program covering organizational behavior, operations, strategic management, and entrepreneurship.',
      isConfigurable: false,
      isActive: true,
    },
  });

  const econProg = await prisma.program.upsert({
    where: { code: 'ECON' },
    update: {},
    create: {
      categoryId: exitCategory.id,
      name: 'Economics',
      code: 'ECON',
      level: 'BSc / BA',
      description: 'Covers microeconomics, macroeconomics, econometrics, development economics, and monetary economics.',
      isConfigurable: false,
      isActive: true,
    },
  });

  // COC Occupational Qualification (Configurable placeholder adhering to content rule)
  const cocProg = await prisma.program.upsert({
    where: { code: 'COC-ACCFIN-L4' },
    update: {},
    create: {
      categoryId: cocCategory.id,
      name: 'Accounts & Budget Service / Level IV',
      code: 'COC-ACCFIN-L4',
      level: 'Level IV',
      description: 'Configurable occupational qualification catalog entry. Units and occupational standards remain unpublished pending official verification.',
      isConfigurable: true,
      isActive: true,
    },
  });

  // 5. Seed Courses & Topics for Accounting & Finance
  const courseAudit = await prisma.course.upsert({
    where: { id: 'crs-acc-01' },
    update: {},
    create: {
      id: 'crs-acc-01',
      programId: accProg.id,
      name: 'Principles of Auditing & Assurance Services',
      code: 'ACCT-301',
      description: 'Audit concepts, professional ethics, internal controls, and Ethiopian auditor responsibilities.',
      orderIndex: 1,
    },
  });

  const topicAuditEvidence = await prisma.topic.upsert({
    where: { id: 'top-acc-01' },
    update: {},
    create: {
      id: 'top-acc-01',
      courseId: courseAudit.id,
      name: 'Audit Evidence and Documentation',
      code: 'TOP-AED-01',
      description: 'Sufficient appropriate audit evidence, working papers, and substantive testing procedures.',
    },
  });

  // 6. Sample Verified Question with strict citation
  const sampleQuestion = await prisma.question.upsert({
    where: { id: 'q-sample-acc-01' },
    update: {},
    create: {
      id: 'q-sample-acc-01',
      topicId: topicAuditEvidence.id,
      stem: 'Which of the following forms of audit evidence is generally considered the most reliable by an independent auditor?',
      explanation: 'Evidence obtained directly by the auditor through physical observation or received directly from independent third parties (e.g. bank confirmations) is more reliable than internally generated documentation.',
      referenceSource: 'Standard Auditing Principles / MoE Higher Education Benchmark (ISA 500)',
      difficulty: DifficultyLevel.INTERMEDIATE,
      status: QuestionStatus.VERIFIED,
      isPublished: true,
      authorId: contentEditor.id,
      reviewerId: reviewer.id,
      options: {
        create: [
          {
            text: 'Direct confirmation sent to the auditor from an independent financial institution.',
            isCorrect: true,
            orderIndex: 0,
            explanation: 'Third-party direct confirmations provide strong external corroborating evidence.',
          },
          {
            text: 'Internally generated sales invoice copies stored in the client filing system.',
            isCorrect: false,
            orderIndex: 1,
            explanation: 'Internal evidence is susceptible to client management override and alteration.',
          },
          {
            text: 'Oral representations obtained from the client managing director.',
            isCorrect: false,
            orderIndex: 2,
            explanation: 'Inquiries of management alone do not provide sufficient audit evidence.',
          },
          {
            text: 'Client-prepared quarterly bank reconciliation worksheets.',
            isCorrect: false,
            orderIndex: 3,
            explanation: 'Client-prepared worksheets require independent verification against bank statements.',
          },
        ],
      },
    },
  });

  // 7. Seed Subscription Plans
  await prisma.subscriptionPlan.upsert({
    where: { tier: SubscriptionTier.FREE },
    update: {},
    create: {
      id: 'plan-free-01',
      name: 'Free Practice Tier',
      tier: SubscriptionTier.FREE,
      priceETB: 0.0,
      durationDays: 365,
      features: ['Access to verified free sample practice questions', 'Basic score reports', 'Community forum access'],
      isActive: true,
    },
  });

  const stdPlan = await prisma.subscriptionPlan.upsert({
    where: { tier: SubscriptionTier.STANDARD_MONTHLY },
    update: {},
    create: {
      id: 'plan-std-02',
      name: 'Standard Monthly Pass',
      tier: SubscriptionTier.STANDARD_MONTHLY,
      priceETB: 150.0,
      durationDays: 30,
      features: ['Full question bank access', 'Unlimited practice attempts', 'Subject-by-subject performance analysis', 'Detailed explanation citations'],
      isActive: true,
    },
  });

  await prisma.subscriptionPlan.upsert({
    where: { tier: SubscriptionTier.PREMIUM_SEMESTER },
    update: {},
    create: {
      id: 'plan-prem-03',
      name: 'Premium Semester Pass',
      tier: SubscriptionTier.PREMIUM_SEMESTER,
      priceETB: 350.0,
      durationDays: 120,
      features: ['Full question bank access', 'Unlimited timed mock exams matching MoE blueprints', 'CBE / Telebirr instant slip verification', 'Priority revision topics', 'Mock exam timer simulations'],
      isActive: true,
    },
  });

  // 8. Sample Payment Receipt for Testing Verification Workflow
  await prisma.paymentReceipt.upsert({
    where: { transactionRef: 'FT26298ABCD1234' },
    update: {},
    create: {
      userId: student.id,
      bankName: PaymentMethod.TELEBIRR,
      transactionRef: 'FT26298ABCD1234',
      amountETB: 150.0,
      notes: 'Paid via Telebirr for Standard Monthly subscription',
      status: PaymentStatus.SUBMITTED,
    },
  });

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

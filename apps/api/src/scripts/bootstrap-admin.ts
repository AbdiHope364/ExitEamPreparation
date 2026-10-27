import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';
import { prisma, UserRole as PrismaUserRole } from '@exitprep/database';
import { UserRole as SharedUserRole } from '@exitprep/shared';
import { dbStore } from '../db.js';

// Ensure .env is loaded from the root or local directory
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

async function bootstrapAdmin() {
  const name = process.env.BOOTSTRAP_ADMIN_NAME?.trim();
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD;

  console.log('='.repeat(60));
  console.log(' ExitPrep Ethiopia — Super Administrator Bootstrap');
  console.log('='.repeat(60));

  if (!name) {
    console.error('❌ Error: BOOTSTRAP_ADMIN_NAME is required in .env');
    process.exit(1);
  }

  if (!email || !email.includes('@')) {
    console.error('❌ Error: A valid BOOTSTRAP_ADMIN_EMAIL is required in .env');
    process.exit(1);
  }

  if (!password || password.length < 14) {
    console.error(
      '❌ Security Requirement Error: BOOTSTRAP_ADMIN_PASSWORD must be at least 14 characters long for administrator accounts.'
    );
    process.exit(1);
  }

  console.log(`👤 Admin Name:     ${name}`);
  console.log(`📧 Admin Email:    ${email}`);
  console.log(`🔒 Hashing administrator password with bcrypt (12 rounds)...`);

  const salt = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  let postgresSuccess = false;

  // 1. Attempt PostgreSQL persistence via Prisma
  try {
    const existing = await prisma.user.findFirst({
      where: { email },
    });

    if (existing) {
      await prisma.user.update({
        where: { id: existing.id },
        data: {
          fullName: name,
          passwordHash,
          role: PrismaUserRole.SUPER_ADMINISTRATOR,
          isActive: true,
        },
      });
      console.log(`✅ [PostgreSQL] Successfully promoted/updated existing account to SUPER_ADMINISTRATOR: ${email}`);
    } else {
      await prisma.user.create({
        data: {
          fullName: name,
          email,
          passwordHash,
          role: PrismaUserRole.SUPER_ADMINISTRATOR,
          isActive: true,
        },
      });
      console.log(`✅ [PostgreSQL] Successfully created new SUPER_ADMINISTRATOR: ${email}`);
    }
    postgresSuccess = true;
  } catch (err: any) {
    console.warn(`⚠️ [PostgreSQL] Database connection unavailable (${err.code || err.message}).`);
    console.log(`ℹ️ [Database Store] Synchronizing fallback memory store...`);
  }

  // 2. Also register in in-memory fallback store
  const memUser = dbStore.users.find((u) => u.email?.toLowerCase() === email);
  if (memUser) {
    memUser.fullName = name;
    memUser.passwordHash = passwordHash;
    memUser.role = SharedUserRole.SUPER_ADMINISTRATOR;
    memUser.isActive = true;
    console.log(`✅ [Local Store] Updated administrator profile: ${email}`);
  } else {
    dbStore.users.push({
      id: `usr-admin-${Date.now()}`,
      email,
      fullName: name,
      passwordHash,
      role: SharedUserRole.SUPER_ADMINISTRATOR,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`✅ [Local Store] Registered administrator account: ${email}`);
  }

  console.log('='.repeat(60));
  console.log('🎉 Super Administrator Bootstrap completed successfully!');
  console.log('IMPORTANT:');
  console.log('👉 Please remove BOOTSTRAP_ADMIN_PASSWORD from your .env file now.');
  console.log('👉 Never commit raw admin credentials to version control.');
  console.log('='.repeat(60));

  if (postgresSuccess) {
    await prisma.$disconnect();
  }
}

bootstrapAdmin().catch((err) => {
  console.error('Fatal bootstrap error:', err);
  process.exit(1);
});

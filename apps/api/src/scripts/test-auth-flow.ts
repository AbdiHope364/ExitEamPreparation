import { app } from '../app.js';
import { dbStore } from '../db.js';
import { Server } from 'http';

interface TestResult {
  title: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function parseCookie(setCookieHeaders: string[] | string | null): string | undefined {
  if (!setCookieHeaders) return undefined;
  const raw = Array.isArray(setCookieHeaders) ? setCookieHeaders.join('; ') : setCookieHeaders;
  const match = raw.match(/exitprep_session=([^;]+)/);
  return match ? match[1] : undefined;
}

async function runTests() {
  console.log('='.repeat(70));
  console.log('🧪 ExitPrep Ethiopia — Authentication & RBAC Integration Tests');
  console.log('='.repeat(70));

  let server: Server | undefined;
  let baseUrl = '';

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server?.address();
      const port = typeof addr === 'object' && addr ? addr.port : 4000;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`🚀 Test server listening on ${baseUrl}`);
      resolve();
    });
  });

  async function test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      results.push({ title: name, passed: true });
      console.log(`  ✅ PASS: ${name}`);
    } catch (err: any) {
      results.push({ title: name, passed: false, error: err.message });
      console.error(`  ❌ FAIL: ${name} -> ${err.message}`);
    }
  }

  try {
    let studentCookie: string | undefined;
    let phoneStudentCookie: string | undefined;
    let adminCookie: string | undefined;

    // Test 1: Register with Email
    await test('1. Student registration with email', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test.student@exitprep.et',
          fullName: 'Test Student One',
          password: 'SecretPassword123',
        }),
      });

      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.success === true, 'Response success should be true');
      assert(body.data.user.email === 'test.student@exitprep.et', 'Email mismatch');
      assert(body.data.user.role === 'STUDENT', 'User role should be STUDENT');

      const setCookie = res.headers.get('set-cookie');
      studentCookie = parseCookie(setCookie);
      assert(!!studentCookie, 'HttpOnly exitprep_session cookie must be set');
    });

    // Test 2: Register with Phone
    await test('2. Student registration with phone', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+251911887766',
          fullName: 'Chaltu Phone User',
          password: 'SecretPassword123',
        }),
      });

      assert(res.status === 201, `Expected 201, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.success === true, 'Response success should be true');
      assert(body.data.user.phone === '+251911887766', 'Phone mismatch');

      const setCookie = res.headers.get('set-cookie');
      phoneStudentCookie = parseCookie(setCookie);
      assert(!!phoneStudentCookie, 'HttpOnly session cookie must be set for phone user');
    });

    // Test 3: Validation Error - Missing both email and phone
    await test('3. Registration rejected when neither email nor phone is provided', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: 'Invalid User',
          password: 'SecretPassword123',
        }),
      });

      assert(res.status === 400, `Expected 400 Bad Request, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.success === false, 'Should fail validation');
      assert(body.error.code === 'VALIDATION_ERROR', 'Expected VALIDATION_ERROR');
    });

    // Test 4: Duplicate Email Rejection
    await test('4. Duplicate email registration rejected (409 Conflict)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test.student@exitprep.et',
          fullName: 'Duplicate Student',
          password: 'AnotherPassword123',
        }),
      });

      assert(res.status === 409, `Expected 409 Conflict, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.error.code === 'USER_EXISTS', 'Expected USER_EXISTS');
    });

    // Test 5: Login with Email
    await test('5. Student login using email and password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test.student@exitprep.et',
          password: 'SecretPassword123',
        }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.success === true, 'Login should succeed');
      assert(body.data.user.email === 'test.student@exitprep.et', 'User email match');

      const setCookie = res.headers.get('set-cookie');
      studentCookie = parseCookie(setCookie);
      assert(!!studentCookie, 'Session cookie must be updated on login');
    });

    // Test 6: Login with Phone
    await test('6. Student login using phone number and password', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: '+251911887766',
          password: 'SecretPassword123',
        }),
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.success === true, 'Login with phone should succeed');
    });

    // Test 7: Login with Invalid Password
    await test('7. Login rejected on invalid password (401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test.student@exitprep.et',
          password: 'WrongPassword999!',
        }),
      });

      assert(res.status === 401, `Expected 401 Unauthorized, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.error.code === 'INVALID_CREDENTIALS', 'Expected INVALID_CREDENTIALS');
    });

    // Test 8: Current User Profile via Session Cookie (/api/v1/auth/me)
    await test('8. Persistent session verified via GET /api/v1/auth/me with cookie', async () => {
      assert(!!studentCookie, 'Student cookie should exist');
      const res = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Cookie: `exitprep_session=${studentCookie}`,
        },
      });

      assert(res.status === 200, `Expected 200 OK, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.success === true, 'Request should succeed');
      assert(body.data.email === 'test.student@exitprep.et', 'Current user email match');
      assert(body.data.role === 'STUDENT', 'Current user role match');
      assert(!!body.data.activeSubscription, 'User should have auto-assigned free subscription');
    });

    // Test 9: Anonymous Access Rejected on Protected Route
    await test('9. Unauthenticated request to /api/v1/auth/me rejected (401)', async () => {
      const res = await fetch(`${baseUrl}/api/v1/auth/me`);
      assert(res.status === 401, `Expected 401, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.error.code === 'UNAUTHORIZED', 'Expected UNAUTHORIZED');
    });

    // Test 10: Server-side RBAC - Student Forbidden on Admin Routes
    await test('10. Server-side role check: Student blocked from Admin API (403 FORBIDDEN)', async () => {
      assert(!!studentCookie, 'Student cookie should exist');
      const res = await fetch(`${baseUrl}/api/v1/admin/dashboard`, {
        headers: {
          Cookie: `exitprep_session=${studentCookie}`,
        },
      });

      assert(res.status === 403, `Expected 403 Forbidden, got ${res.status}`);
      const body = (await res.json()) as any;
      assert(body.error.code === 'FORBIDDEN', 'Expected FORBIDDEN error code');
      assert(body.error.message.includes('Insufficient permissions'), 'Expected permission message');
    });

    // Test 11: Admin Login and Staff Route Access
    await test('11. Staff access: Super Administrator accessing Admin API (200 OK)', async () => {
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@exitprep.et',
          password: 'Admin@ExitPrep2026!',
        }),
      });

      assert(loginRes.status === 200, `Admin login failed: ${loginRes.status}`);
      const loginBody = (await loginRes.json()) as any;
      assert(loginBody.data.user.role === 'SUPER_ADMINISTRATOR', 'User should be SUPER_ADMINISTRATOR');

      const setCookie = loginRes.headers.get('set-cookie');
      adminCookie = parseCookie(setCookie);
      assert(!!adminCookie, 'Admin cookie should be received');

      const dashRes = await fetch(`${baseUrl}/api/v1/admin/dashboard`, {
        headers: {
          Cookie: `exitprep_session=${adminCookie}`,
        },
      });

      assert(dashRes.status === 200, `Admin dashboard should return 200, got ${dashRes.status}`);
      const dashBody = (await dashRes.json()) as any;
      assert(dashBody.success === true, 'Dashboard success true');
      assert(typeof dashBody.data.stats.totalStudents === 'number', 'Stats totalStudents should exist');
    });

    // Test 12: Suspended User Handling
    await test('12. Suspended account rejected upon login and during active session (403)', async () => {
      // Create user then suspend
      const user = dbStore.users.find((u) => u.email === 'test.student@exitprep.et');
      if (!user) {
        throw new Error('Student user must exist in local database');
      }
      user.isActive = false;

      // 1. Existing session check
      const sessionCheckRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Cookie: `exitprep_session=${studentCookie}`,
        },
      });
      assert(sessionCheckRes.status === 403, `Expected 403 for suspended user session, got ${sessionCheckRes.status}`);
      const sessionBody = (await sessionCheckRes.json()) as any;
      assert(sessionBody.error.code === 'ACCOUNT_SUSPENDED', 'Expected ACCOUNT_SUSPENDED');

      // 2. Login check
      const loginRes = await fetch(`${baseUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test.student@exitprep.et',
          password: 'SecretPassword123',
        }),
      });
      assert(loginRes.status === 403, `Expected 403 for suspended user login, got ${loginRes.status}`);
      const loginBody = (await loginRes.json()) as any;
      assert(loginBody.error.code === 'ACCOUNT_SUSPENDED', 'Expected ACCOUNT_SUSPENDED');

      // Re-activate for further tests
      user.isActive = true;
    });

    // Test 13: Logout and Session Revocation
    await test('13. Logout revokes session and clears HttpOnly cookie', async () => {
      assert(!!studentCookie, 'Student cookie should exist');

      const logoutRes = await fetch(`${baseUrl}/api/v1/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: `exitprep_session=${studentCookie}`,
        },
      });

      assert(logoutRes.status === 200, `Expected 200 on logout, got ${logoutRes.status}`);
      const logoutBody = (await logoutRes.json()) as any;
      assert(logoutBody.success === true, 'Logout should succeed');

      // Cookie header should clear or expire the cookie
      const setCookie = logoutRes.headers.get('set-cookie');
      assert(!!setCookie, 'Logout should send Set-Cookie header');

      // Now attempt to use the revoked session
      const meRes = await fetch(`${baseUrl}/api/v1/auth/me`, {
        headers: {
          Cookie: `exitprep_session=${studentCookie}`,
        },
      });

      assert(meRes.status === 401, `Expected 401 for revoked session, got ${meRes.status}`);
      const meBody = (await meRes.json()) as any;
      assert(meBody.error.code === 'SESSION_EXPIRED', 'Expected SESSION_EXPIRED on revoked session');
    });
  } finally {
    server?.close();
  }

  console.log('='.repeat(70));
  const failed = results.filter((r) => !r.passed);
  if (failed.length === 0) {
    console.log(`🎉 All ${results.length} authentication integration tests passed successfully!`);
    console.log('='.repeat(70));
    process.exit(0);
  } else {
    console.error(`💥 ${failed.length} of ${results.length} tests failed!`);
    console.log('='.repeat(70));
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

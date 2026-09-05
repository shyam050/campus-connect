/**
 * End-to-end API smoke test against an in-memory MongoDB.
 * Run: npm run smoke
 * Exercises: health, auth + refresh rotation, RBAC, eligibility filtering,
 * apply-with-resume, applicant pipeline, prep tracker, admin analytics.
 */

const results: { name: string; ok: boolean; detail?: string }[] = [];

function check(name: string, ok: boolean, detail?: string) {
  results.push({ name, ok, detail });
  console.log(`${ok ? '✓' : '✗'} ${name}${!ok && detail ? ` — ${detail}` : ''}`);
}

function makeTokenFetch(base: string, token: string | null, cookie?: string) {
  return async (path: string, init: RequestInit = {}) => {
    const headers: Record<string, string> = {
      ...((init.headers as Record<string, string>) ?? {}),
    };
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cookie) headers.Cookie = cookie;
    return fetch(`${base}${path}`, {
      ...init,
      headers: init.body && !(init.body instanceof FormData) ? { 'Content-Type': 'application/json', ...headers } : headers,
    });
  };
}

const j = async (r: Response): Promise<any> => r.json();

async function main() {
  process.env.NODE_ENV = 'test';
  process.env.DISABLE_CRON = 'true';

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  console.log('Starting in-memory MongoDB (first run downloads a binary)…');
  const mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('campusconnect');

  const { connectDB, disconnectDB } = await import('../config/db');
  const { default: app } = await import('../app');
  const { Application } = await import('../models/Application');
  const { User } = await import('../models/User');
  const { Job } = await import('../models/Job');

  await connectDB();
  const server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}`;

  // ── Seed minimal data directly ───────────────────────────────
  const bcrypt = (await import('bcryptjs')).default;
  const hash = bcrypt.hashSync('Passw0rd!', 10);

  const admin = await User.create({
    name: 'Admin Test', email: 'admin@test.edu', password: hash,
    role: 'admin', department: 'CSE', batch: 2020, isVerified: true,
  });
  const coordinator = await User.create({
    name: 'Coord Test', email: 'coord@test.edu', password: hash,
    role: 'coordinator', department: 'CSE', batch: 2019, isVerified: true,
  });
  const goodStudent = await User.create({
    name: 'Good Student', email: 'good@test.edu', password: hash,
    role: 'student', department: 'CSE', batch: 2026, cgpa: 9.0, backlogs: 0, isVerified: true,
  });
  const weakStudent = await User.create({
    name: 'Weak Student', email: 'weak@test.edu', password: hash,
    role: 'student', department: 'CSE', batch: 2026, cgpa: 6.0, backlogs: 2, isVerified: true,
  });

  // ── Health ───────────────────────────────────────────────────
  const health = await fetch(`${base}/health`);
  check('GET /health', health.status === 200);

  // ── Auth: login ──────────────────────────────────────────────
  const badLogin = await fetch(`${base}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'good@test.edu', password: 'wrong' }),
  });
  check('Login rejects wrong password (401)', badLogin.status === 401);

  const login = async (email: string, password = 'Passw0rd!') => {
    const res = await fetch(`${base}/api/v1/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await j(res);
    const setCookie = res.headers.getSetCookie?.().find((c) => c.startsWith('refreshToken=')) ?? '';
    return { token: body.data?.accessToken as string, cookie: setCookie.split(';')[0], res, body };
  };

  const sLogin = await login('good@test.edu');
  check('Student login returns accessToken', sLogin.res.status === 200 && Boolean(sLogin.token));
  check('Login sets httpOnly refresh cookie', sLogin.cookie.startsWith('refreshToken='));
  const wLogin = await login('weak@test.edu');
  const cLogin = await login('coord@test.edu');
  const aLogin = await login('admin@test.edu');

  const asStudent = makeTokenFetch(base, sLogin.token);
  const asWeak = makeTokenFetch(base, wLogin.token);
  const asCoord = makeTokenFetch(base, cLogin.token);
  const asAdmin = makeTokenFetch(base, aLogin.token);

  // ── RBAC ─────────────────────────────────────────────────────
  const noAuth = await fetch(`${base}/api/v1/jobs`);
  check('Unauthenticated request rejected (401)', noAuth.status === 401);

  const studentPostsJob = await asStudent('/api/v1/jobs', {
    method: 'POST',
    body: JSON.stringify({ company: 'X', role: 'X', description: 'xxxxxxxxxxxxxxxxxxxx', type: 'fulltime', location: 'X', deadline: new Date(), eligibility: { minCgpa: 0, maxBacklogs: 0, departments: ['CSE'], batch: 2026 } }),
  });
  check('Student cannot post job (403)', studentPostsJob.status === 403);

  const coordTouchesAdmin = await asCoord('/api/v1/admin/users');
  check('Coordinator cannot access admin routes (403)', coordTouchesAdmin.status === 403);

  const studentSeesApplicants = await asStudent('/api/v1/applications');
  check('Student cannot list all applications (403)', studentSeesApplicants.status === 403);

  // ── Jobs: post + eligibility filtering ───────────────────────
  const createJob = async (payload: Record<string, unknown>) =>
    asCoord('/api/v1/jobs', { method: 'POST', body: JSON.stringify(payload) });

  const hardJob = await createJob({
    company: 'HardCorp', role: 'Backend Engineer', description: 'Very selective role requiring a high CGPA.',
    type: 'fulltime', location: 'Remote',
    deadline: new Date(Date.now() + 5 * 864e5).toISOString(),
    eligibility: { minCgpa: 8.5, maxBacklogs: 0, departments: ['CSE'], batch: 2026 },
    salary: { min: 1000000, max: 1500000, currency: 'INR' },
  });
  check('Coordinator posts job (201)', hardJob.status === 201);
  const hardJobId = (await j(hardJob)).data._id as string;

  const easyJob = await createJob({
    company: 'EasyCorp', role: 'QA Intern', description: 'Internship open to all departments and CGPAs.',
    type: 'internship', location: 'Onsite',
    deadline: new Date(Date.now() + 2 * 864e5).toISOString(),
    eligibility: { minCgpa: 5.0, maxBacklogs: 3, departments: ['CSE', 'IT', 'ECE'], batch: 2026 },
  });
  const easyJobId = (await j(easyJob)).data._id as string;

  const goodFeed = await j(await asStudent('/api/v1/jobs'));
  const weakFeed = await j(await asWeak('/api/v1/jobs'));
  const goodIds = (goodFeed.data as { _id: string }[]).map((j) => j._id);
  const weakIds = (weakFeed.data as { _id: string }[]).map((j) => j._id);
  check('Eligible student sees HardCorp', goodIds.includes(hardJobId));
  check('Ineligible student (CGPA 6.0) does NOT see HardCorp', !weakIds.includes(hardJobId));
  check('Ineligible student sees EasyCorp', weakIds.includes(easyJobId));

  // ── Apply with resume ────────────────────────────────────────
  const form = new FormData();
  form.append('resume', new Blob(['%PDF-1.4 fake resume'], { type: 'application/pdf' }), 'resume.pdf');
  const apply = await asStudent(`/api/v1/jobs/${hardJobId}/apply`, { method: 'POST', body: form });
  check('Eligible student applies with resume (201)', apply.status === 201, `status ${apply.status}`);
  const appBody = await j(apply).catch(() => ({ data: null }));
  check('Application stored with resume URL', Boolean(appBody.data?.resumeUrl));

  const form2 = new FormData();
  form2.append('resume', new Blob(['%PDF-1.4 x'], { type: 'application/pdf' }), 'r2.pdf');
  const dupApply = await asStudent(`/api/v1/jobs/${hardJobId}/apply`, { method: 'POST', body: form2 });
  check('Duplicate application rejected (409)', dupApply.status === 409);

  const weakForm = new FormData();
  weakForm.append('resume', new Blob(['%PDF-1.4 y'], { type: 'application/pdf' }), 'w.pdf');
  const weakApply = await asWeak(`/api/v1/jobs/${hardJobId}/apply`, { method: 'POST', body: weakForm });
  check('Ineligible student blocked at apply (403)', weakApply.status === 403);

  const myApps = await j(await asStudent('/api/v1/applications/me'));
  check('Student sees own application', (myApps.data as unknown[]).length === 1);

  // ── Coordinator pipeline ─────────────────────────────────────
  const applicantsRes = await asCoord(`/api/v1/jobs/${hardJobId}/applicants`);
  const applicants = await j(applicantsRes);
  check('Coordinator lists applicants', applicantsRes.status === 200 && applicants.data.applications.length === 1);

  const appId = applicants.data.applications[0]._id as string;
  const shortlist = await asCoord(`/api/v1/applications/${appId}/status`, {
    method: 'PATCH', body: JSON.stringify({ status: 'shortlisted', notes: 'Great resume' }),
  });
  check('Coordinator updates status', shortlist.status === 200);

  const selected = await asCoord(`/api/v1/applications/${appId}/status`, {
    method: 'PATCH', body: JSON.stringify({ status: 'selected' }),
  });
  check('Coordinator marks selected', selected.status === 200);

  const mineAfter = await j(await asStudent('/api/v1/applications/me'));
  check('Student sees updated status + note', mineAfter.data[0].status === 'selected' && mineAfter.data[0].notes === 'Great resume');

  // ── Prep tracker ─────────────────────────────────────────────
  const modRes = await asStudent('/api/v1/prep', {
    method: 'POST', body: JSON.stringify({
      title: 'DSA',
      subtopics: [
        { title: 'Arrays' }, { title: 'Trees' }, { title: 'Graphs' },
      ],
    }),
  });
  check('Create prep module (201)', modRes.status === 201);
  const mod = (await j(modRes)).data;

  const toggle = await asStudent(`/api/v1/prep/${mod._id}/subtopics/0`, {
    method: 'PATCH', body: JSON.stringify({ completed: true }),
  });
  const toggleBody = await j(toggle);
  check('Toggle subtopic → progress 33%', toggle.status === 200 && toggleBody.data.progress === 33, `progress=${toggleBody.data?.progress}`);

  const toggle2 = await asStudent(`/api/v1/prep/${mod._id}/subtopics/1`, {
    method: 'PATCH', body: JSON.stringify({ completed: true }),
  });
  const toggle2Body = await j(toggle2);
  check('Progress 67% + streak ≥ 1', toggle2Body.data.progress === 67 && toggle2Body.data.streak >= 1);

  // ── Analytics (admin) ────────────────────────────────────────
  const analytics = await asAdmin('/api/v1/admin/analytics');
  const analyticsBody = await j(analytics);
  check('Admin analytics loads', analytics.status === 200 && Boolean(analyticsBody.data.departmentStats));
  const dept = analyticsBody.data.departmentStats.find((d: { department: string }) => d.department === 'CSE');
  check('Department aggregation reflects the selected offer', dept?.totalOffers === 1, `totalOffers=${dept?.totalOffers}`);
  check('Overview counts students', analyticsBody.data.overview.totalStudents >= 2);

  const coordAnalytics = await asCoord('/api/v1/admin/analytics');
  check('Coordinator blocked from analytics (403)', coordAnalytics.status === 403);

  // ── Refresh rotation ─────────────────────────────────────────
  const refreshRes = await fetch(`${base}/api/v1/auth/refresh`, {
    method: 'POST', headers: { Cookie: sLogin.cookie },
  });
  const refreshBody = await j(refreshRes);
  check('Refresh issues new access token', refreshRes.status === 200 && Boolean(refreshBody.data.accessToken));

  const reusedRes = await fetch(`${base}/api/v1/auth/refresh`, {
    method: 'POST', headers: { Cookie: sLogin.cookie },
  });
  check('Reused (rotated-out) refresh token rejected (401)', reusedRes.status === 401);

  // ── Cleanup ──────────────────────────────────────────────────
  const failed = results.filter((r) => !r.ok);
  console.log('──────────────────────────────────────');
  console.log(`${results.length - failed.length}/${results.length} checks passed`);
  console.log('──────────────────────────────────────');

  server.close();
  await disconnectDB();
  await mongod.stop();
  process.exit(failed.length ? 1 : 0);
}

main().catch(async (err) => {
  console.error('Smoke test crashed:', err);
  process.exit(1);
});

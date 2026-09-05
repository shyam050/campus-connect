/**
 * Seed script — creates demo accounts, jobs, applications and prep modules.
 * Run: npm run seed
 * Wipes existing collections first, so never point it at a production DB.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db';
import { User } from '../models/User';
import { Job } from '../models/Job';
import { Application } from '../models/Application';
import { PrepModule } from '../models/PrepModule';

const daysFromNow = (d: number, hour = 23) => {
  const date = new Date();
  date.setDate(date.getDate() + d);
  date.setHours(hour, 59, 0, 0);
  return date;
};

const daysAgo = (d: number) => {
  const date = new Date();
  date.setDate(date.getDate() - d);
  return date;
};

async function seed() {
  await connectDB();

  console.log('Clearing collections...');
  await Promise.all([
    User.deleteMany({}),
    Job.deleteMany({}),
    Application.deleteMany({}),
    PrepModule.deleteMany({}),
  ]);

  const password = (p: string) => bcrypt.hashSync(p, 10);

  console.log('Creating users...');
  const admin = await User.create({
    name: 'Dr. Anitha Rao',
    email: 'admin@campus.edu',
    password: password('Admin@123'),
    role: 'admin',
    department: 'CSE',
    batch: 2020,
    isVerified: true,
  });

  const coordinator = await User.create({
    name: 'Prof. Ramesh Kumar',
    email: 'coordinator@campus.edu',
    password: password('Coord@123'),
    role: 'coordinator',
    department: 'CSE',
    batch: 2018,
    isVerified: true,
  });

  const studentSeed = [
    { name: 'Aarav Sharma', dept: 'CSE', cgpa: 9.2, backlogs: 0 },
    { name: 'Diya Patel', dept: 'CSE', cgpa: 8.7, backlogs: 0 },
    { name: 'Rohan Verma', dept: 'CSE', cgpa: 7.4, backlogs: 1 },
    { name: 'Sneha Iyer', dept: 'IT', cgpa: 8.9, backlogs: 0 },
    { name: 'Karthik Reddy', dept: 'IT', cgpa: 6.8, backlogs: 2 },
    { name: 'Ananya Gupta', dept: 'ECE', cgpa: 9.0, backlogs: 0 },
    { name: 'Vikram Singh', dept: 'ECE', cgpa: 7.9, backlogs: 0 },
    { name: 'Priya Nair', dept: 'EEE', cgpa: 8.3, backlogs: 0 },
    { name: 'Arjun Mehta', dept: 'MECH', cgpa: 8.1, backlogs: 0 },
    { name: 'Ishita Joshi', dept: 'CSE', cgpa: 9.5, backlogs: 0 },
    { name: 'Manav Desai', dept: 'CSE', cgpa: 6.5, backlogs: 1 },
    { name: 'Kavya Menon', dept: 'IT', cgpa: 8.5, backlogs: 0 },
  ];

  const students = await User.insertMany(
    studentSeed.map((s, i) => ({
      name: s.name,
      email: `${s.name.split(' ')[0].toLowerCase()}.student@campus.edu`,
      password: password('Student@123'),
      role: 'student',
      department: s.dept,
      batch: 2026,
      cgpa: s.cgpa,
      backlogs: s.backlogs,
      isVerified: true,
      prepActivity: [daysAgo(i % 5), daysAgo((i % 5) + 1), daysAgo((i % 5) + 2)],
    }))
  );

  console.log('Creating jobs...');
  const jobs = await Job.insertMany([
    {
      company: 'Google',
      role: 'Software Engineer, University Graduate',
      description:
        'Join Google engineering to build products used by billions. You will work on core infrastructure, search, and distributed systems. Expect strong fundamentals in data structures, algorithms and system design. Interviews: online assessment + 4 technical rounds.',
      type: 'fulltime',
      eligibility: { minCgpa: 8.0, maxBacklogs: 0, departments: ['CSE', 'IT', 'ECE'], batch: 2026 },
      deadline: daysFromNow(3),
      salary: { min: 2_400_000, max: 3_200_000, currency: 'INR' },
      location: 'Bengaluru',
      postedBy: coordinator._id,
      applicants: [],
      status: 'open',
    },
    {
      company: 'Microsoft',
      role: 'Software Engineer — IDC',
      description:
        'Build cloud-scale services on Azure. Full-stack ownership from design to deployment. Great exposure to distributed systems, ML services and developer tooling. Requires strong CS fundamentals and one or two solid projects.',
      type: 'fulltime',
      eligibility: { minCgpa: 7.5, maxBacklogs: 0, departments: ['CSE', 'IT', 'ECE', 'EEE'], batch: 2026 },
      deadline: daysFromNow(7),
      salary: { min: 1_800_000, max: 2_600_000, currency: 'INR' },
      location: 'Hyderabad',
      postedBy: coordinator._id,
      applicants: [],
      status: 'open',
    },
    {
      company: 'Amazon',
      role: 'SDE Intern (Summer 2026)',
      description:
        '12-week summer internship working with an SDE mentor on real production code. Conversion to full-time based on performance. Expect leadership-principle based behavioural rounds plus coding rounds.',
      type: 'internship',
      eligibility: { minCgpa: 7.0, maxBacklogs: 1, departments: ['CSE', 'IT'], batch: 2026 },
      deadline: daysFromNow(1),
      salary: { min: 100_000, max: 150_000, currency: 'INR' },
      location: 'Chennai',
      postedBy: coordinator._id,
      applicants: [],
      status: 'open',
    },
    {
      company: 'Zoho',
      role: 'Member Technical Staff',
      description:
        'Zoho builds 55+ products end-to-end in-house. Work on web applications, mobile or R&D. Written test covers C, Java, data structures and aptitude. Low-stress culture, Chennai based.',
      type: 'fulltime',
      eligibility: { minCgpa: 6.0, maxBacklogs: 2, departments: ['CSE', 'IT', 'ECE', 'EEE', 'MECH'], batch: 2026 },
      deadline: daysFromNow(10),
      salary: { min: 650_000, max: 900_000, currency: 'INR' },
      location: 'Chennai',
      postedBy: coordinator._id,
      applicants: [],
      status: 'open',
    },
    {
      company: 'Deloitte',
      role: 'Analyst — Technology Consulting',
      description:
        'Client-facing technology consulting: cloud migration, ERP implementations, data analytics. Strong communication skills matter as much as coding. Group discussion + case interview + technical round.',
      type: 'fulltime',
      eligibility: { minCgpa: 7.0, maxBacklogs: 0, departments: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'], batch: 2026 },
      deadline: daysFromNow(6),
      salary: { min: 550_000, max: 750_000, currency: 'INR' },
      location: 'Mumbai',
      postedBy: coordinator._id,
      applicants: [],
      status: 'open',
    },
    {
      company: 'Freshworks',
      role: 'Product Engineer',
      description:
        'Build SaaS products (Freshdesk, Freshservice) with React frontends and Node.js backends. Ownership culture, hack-days, and direct customer impact. Requires a portfolio project using modern JS.',
      type: 'fulltime',
      eligibility: { minCgpa: 6.5, maxBacklogs: 1, departments: ['CSE', 'IT'], batch: 2026 },
      deadline: daysFromNow(14),
      salary: { min: 900_000, max: 1_400_000, currency: 'INR' },
      location: 'Chennai',
      postedBy: coordinator._id,
      applicants: [],
      status: 'open',
    },
    {
      company: 'Infosys',
      role: 'Systems Engineer (PPO via Instep)',
      description:
        'Pre-placement offer channel for students who completed the InfyTQ certification. Training in Mysore, deployment across digital services. Good for a stable start with strong L&D.',
      type: 'ppo',
      eligibility: { minCgpa: 6.0, maxBacklogs: 2, departments: ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL'], batch: 2026 },
      deadline: daysFromNow(21),
      salary: { min: 400_000, max: 500_000, currency: 'INR' },
      location: 'Mysuru',
      postedBy: coordinator._id,
      applicants: [],
      status: 'open',
    },
    {
      company: 'TCS',
      role: 'Assistant System Engineer (2025 drive)',
      description:
        'NQT-based mass hiring for the 2025 batch. Notification for reference — the drive closed last month.',
      type: 'fulltime',
      eligibility: { minCgpa: 6.0, maxBacklogs: 1, departments: ['CSE', 'IT', 'ECE'], batch: 2025 },
      deadline: daysFromNow(-12),
      salary: { min: 340_000, max: 380_000, currency: 'INR' },
      location: 'Pune',
      postedBy: coordinator._id,
      applicants: [],
      status: 'closed',
    },
  ]);

  console.log('Creating applications...');
  const [google, microsoft, amazon, zoho, deloitte, freshworks, infosys] = jobs;
  const [aarav, diya, rohan, sneha, karthik, ananya, vikram, priya, arjun, ishita, manav, kavya] =
    students;

  const app = (
    student: typeof students[number],
    job: typeof jobs[number],
    status: string,
    appliedDaysAgo: number,
    notes?: string
  ) => ({
    studentId: student._id,
    jobId: job._id,
    company: job.company,
    role: job.role,
    status,
    appliedAt: daysAgo(appliedDaysAgo),
    resumeUrl: `/uploads/seed-resume-${student.name.split(' ')[0].toLowerCase()}.pdf`,
    notes,
  });

  await Application.insertMany([
    app(aarav, google, 'selected', 24, 'Cleared all 4 rounds. Offer letter received.'),
    app(aarav, microsoft, 'interview_scheduled', 15, 'Round 3 on Friday 10 AM'),
    app(ishita, google, 'shortlisted', 20, 'OA score 9/10'),
    app(ishita, microsoft, 'selected', 28, 'Strong system design round'),
    app(diya, google, 'interview_scheduled', 18),
    app(diya, freshworks, 'selected', 30, 'Offer accepted'),
    app(sneha, microsoft, 'shortlisted', 16),
    app(sneha, amazon, 'applied', 2),
    app(sneha, deloitte, 'under_review', 8),
    app(rohan, zoho, 'applied', 4),
    app(rohan, amazon, 'rejected', 22, 'Did not clear OA — cut-off was 7/10'),
    app(karthik, zoho, 'applied', 3),
    app(karthik, infosys, 'under_review', 12),
    app(ananya, google, 'rejected', 26, 'Rejected in round 2 — graphs'),
    app(ananya, deloitte, 'shortlisted', 14),
    app(vikram, deloitte, 'applied', 5),
    app(vikram, infosys, 'selected', 32, 'PPO via InfyTQ'),
    app(priya, microsoft, 'applied', 6),
    app(arjun, deloitte, 'interview_scheduled', 10),
    app(manav, zoho, 'shortlisted', 11, 'Good written test score'),
    app(kavya, amazon, 'interview_scheduled', 9),
    app(kavya, freshworks, 'under_review', 7),
  ]);

  // Reflect applicants on the jobs
  const jobApplicants: Record<string, unknown[]> = {
    [google.company]: [aarav._id, ishita._id, diya._id, ananya._id],
    [microsoft.company]: [aarav._id, ishita._id, sneha._id, priya._id],
    [amazon.company]: [sneha._id, rohan._id, kavya._id],
    [zoho.company]: [rohan._id, karthik._id, manav._id],
    [deloitte.company]: [sneha._id, ananya._id, vikram._id, arjun._id],
    [freshworks.company]: [diya._id, kavya._id],
    [infosys.company]: [karthik._id, vikram._id],
  };
  for (const job of jobs) {
    const ids = jobApplicants[job.company];
    if (ids) await Job.updateOne({ _id: job._id }, { applicants: ids });
  }

  console.log('Creating prep modules...');
  const prep = (
    userId: mongoose.Types.ObjectId,
    title: string,
    items: [string, boolean][],
    targetDays?: number
  ) => ({
    userId,
    title,
    targetDate: targetDays ? daysFromNow(targetDays) : undefined,
    subtopics: items.map(([t, done]) => ({
      title: t,
      completed: done,
      resources:
        t === 'Dynamic Programming Basics'
          ? [{ title: 'DP Playlist', url: 'https://takeuforward.org/dynamic-programming', type: 'video' as const }]
          : [],
    })),
  });

  await PrepModule.insertMany([
    prep(aarav._id, 'DSA', [
      ['Arrays & Two Pointers', true],
      ['Strings & Sliding Window', true],
      ['Linked Lists & Stacks/Queues', true],
      ['Trees & BST', true],
      ['Graphs (BFS/DFS)', true],
      ['Dynamic Programming Basics', false],
    ], 30),
    prep(aarav._id, 'System Design', [
      ['Load Balancing & Caching', true],
      ['SQL vs NoSQL', true],
      ['Design a URL Shortener', false],
    ], 45),
    prep(diya._id, 'DSA', [
      ['Arrays & Two Pointers', true],
      ['Strings & Sliding Window', true],
      ['Trees & BST', false],
      ['Graphs (BFS/DFS)', false],
    ], 25),
    prep(ishita._id, 'DSA', [
      ['Arrays & Two Pointers', true],
      ['Graphs (BFS/DFS)', true],
      ['Dynamic Programming Basics', true],
    ], 20),
    prep(sneha._id, 'Aptitude', [
      ['Quantitative: Percentages & Ratios', true],
      ['Logical Reasoning', true],
      ['Verbal Ability', false],
    ], 10),
  ]);

  console.log(`
──────────────────────────────────────────────────────
  CampusConnect seeded ✓
──────────────────────────────────────────────────────
  Demo accounts (password shown after the email):
    admin        admin@campus.edu          Admin@123
    coordinator  coordinator@campus.edu    Coord@123
    students     aarav.student@campus.edu  Student@123   (cgpa 9.2, CSE)
                 diya.student@campus.edu   Student@123
                 rohan.student@campus.edu  Student@123   (1 backlog)
                 ...12 students total across CSE/IT/ECE/EEE/MECH
──────────────────────────────────────────────────────
  8 jobs (7 open, 1 closed) · 22 applications · 5 prep modules
──────────────────────────────────────────────────────`);

  await disconnectDB();
}

seed().catch(async (err) => {
  console.error('Seed failed:', err);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});

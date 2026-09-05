import { Application } from '../models/Application';
import { Job } from '../models/Job';
import { User } from '../models/User';

export interface DepartmentStat {
  department: string;
  totalOffers: number;
  avgCgpa: number;
  uniqueCompanies: number;
}

/**
 * Department-wise placement stats — single aggregation round-trip
 * ($lookup joins users, $group rolls up per department) instead of N+1 queries.
 */
export async function getDepartmentStats(): Promise<DepartmentStat[]> {
  return Application.aggregate<DepartmentStat>([
    // Join with users to get department
    {
      $lookup: {
        from: 'users',
        localField: 'studentId',
        foreignField: '_id',
        as: 'student',
      },
    },
    { $unwind: '$student' },

    // Filter selected applications
    { $match: { status: 'selected' } },

    // Group by department
    {
      $group: {
        _id: '$student.department',
        totalOffers: { $sum: 1 },
        avgCgpa: { $avg: '$student.cgpa' },
        companies: { $addToSet: '$company' }, // denormalized on Application
      },
    },

    // Sort by offers descending
    { $sort: { totalOffers: -1 } },

    // Project final shape
    {
      $project: {
        _id: 0,
        department: '$_id',
        totalOffers: 1,
        avgCgpa: { $round: ['$avgCgpa', 2] },
        uniqueCompanies: { $size: '$companies' },
      },
    },
  ]);
}

export async function getStatusDistribution() {
  return Application.aggregate<{ _id: string; count: number }>([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
}

export async function getMonthlyTrend(monthsBack = 6) {
  const start = new Date();
  start.setMonth(start.getMonth() - (monthsBack - 1));
  start.setDate(1);
  start.setHours(0, 0, 0, 0);

  const rows = await Application.aggregate<{ _id: string; count: number }>([
    { $match: { appliedAt: { $gte: start } } },
    { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$appliedAt' } }, count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  // Fill empty months so the chart line is continuous
  const out: { month: string; applications: number }[] = [];
  const cursor = new Date(start);
  for (let i = 0; i < monthsBack; i++) {
    const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
    const found = rows.find((r) => r._id === key);
    out.push({
      month: cursor.toLocaleString('en-US', { month: 'short' }),
      applications: found?.count ?? 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return out;
}

export async function getTopCompanies(limit = 6) {
  return Application.aggregate<{ _id: string; applications: number }>([
    { $group: { _id: '$company', applications: { $sum: 1 } } },
    { $sort: { applications: -1 } },
    { $limit: limit },
  ]);
}

export async function getOverview() {
  const [totalStudents, coordinators, totalJobs, openJobs, totalApplications, selectedAgg] =
    await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'coordinator' }),
      Job.countDocuments(),
      Job.countDocuments({ status: 'open' }),
      Application.countDocuments(),
      Application.distinct('studentId', { status: 'selected' }),
    ]);

  const offers = await Application.countDocuments({ status: 'selected' });
  const placedStudents = selectedAgg.length;

  return {
    totalStudents,
    coordinators,
    totalJobs,
    openJobs,
    totalApplications,
    offers,
    placedStudents,
    placementRate: totalStudents ? Math.round((placedStudents / totalStudents) * 100) : 0,
  };
}

export async function getAnalytics() {
  const [departmentStats, statusDistribution, monthlyTrend, topCompanies, overview] =
    await Promise.all([
      getDepartmentStats(),
      getStatusDistribution(),
      getMonthlyTrend(),
      getTopCompanies(),
      getOverview(),
    ]);

  return { departmentStats, statusDistribution, monthlyTrend, topCompanies, overview };
}

import type { Request, Response } from 'express';
import type { HydratedDocument } from 'mongoose';
import { PrepModule, type IPrepModule } from '../models/PrepModule';
import { User } from '../models/User';
import { ApiError } from '../middleware/error';
import { calculateProgress, calculateStreak, todayStart } from '../services/prepTracker';

async function getOwnedModule(userId: string, moduleId: string): Promise<HydratedDocument<IPrepModule>> {
  const module = await PrepModule.findOne({ _id: moduleId, userId });
  if (!module) throw new ApiError(404, 'NOT_FOUND', 'Prep module not found');
  return module;
}

async function getStreak(userId: string): Promise<number> {
  const user = await User.findById(userId).select('prepActivity');
  return calculateStreak(user?.prepActivity ?? []);
}

// GET /api/v1/prep — user's modules with progress + overall streak
export async function listModules(req: Request, res: Response) {
  const modules = await PrepModule.find({ userId: req.user!.userId }).sort({ createdAt: 1 });
  const withProgress = modules.map((m) => ({
    ...m.toJSON(),
    progress: calculateProgress(m),
  }));

  const overall = withProgress.length
    ? Math.round(
        withProgress.reduce((sum, m) => sum + m.progress, 0) / withProgress.length
      )
    : 0;

  res.json({
    status: 'success',
    data: { modules: withProgress, overall, streak: await getStreak(req.user!.userId) },
  });
}

// POST /api/v1/prep
export async function createModule(req: Request, res: Response) {
  const module = await PrepModule.create({ ...req.body, userId: req.user!.userId });
  res.status(201).json({
    status: 'success',
    data: { ...module.toJSON(), progress: calculateProgress(module) },
  });
}

// PATCH /api/v1/prep/:id
export async function updateModule(req: Request, res: Response) {
  const module = await getOwnedModule(req.user!.userId, req.params.id);
  const { title, targetDate } = req.body as { title?: string; targetDate?: Date | null };
  if (title !== undefined) module.title = title;
  if (targetDate !== undefined) module.targetDate = targetDate ?? undefined;
  await module.save();
  res.json({ status: 'success', data: { ...module.toJSON(), progress: calculateProgress(module) } });
}

// DELETE /api/v1/prep/:id
export async function deleteModule(req: Request, res: Response) {
  const module = await getOwnedModule(req.user!.userId, req.params.id);
  await module.deleteOne();
  res.json({ status: 'success', data: { message: 'Module deleted' } });
}

// POST /api/v1/prep/:id/subtopics
export async function addSubtopic(req: Request, res: Response) {
  const module = await getOwnedModule(req.user!.userId, req.params.id);
  const { title, resources } = req.body as { title: string; resources: IPrepModule['subtopics'][number]['resources'] };
  module.subtopics.push({ title, completed: false, resources: resources ?? [] });
  await module.save();
  res.status(201).json({ status: 'success', data: { ...module.toJSON(), progress: calculateProgress(module) } });
}

// PATCH /api/v1/prep/:moduleId/subtopics/:subtopicIndex — toggle completion
export async function toggleSubtopic(req: Request, res: Response) {
  const { moduleId, subtopicIndex } = req.params;
  const { completed } = req.body as { completed: boolean };

  // Validate the index belongs to this user's module before the positional $set
  const owned = await getOwnedModule(req.user!.userId, moduleId);
  const index = Number(subtopicIndex);
  if (!Number.isInteger(index) || index < 0 || index >= owned.subtopics.length) {
    throw new ApiError(404, 'NOT_FOUND', 'Subtopic not found');
  }

  const module = await PrepModule.findOneAndUpdate(
    { _id: moduleId, userId: req.user!.userId },
    { $set: { [`subtopics.${subtopicIndex}.completed`]: completed } },
    { new: true }
  );

  // Record daily activity for the streak (one entry per day)
  await User.updateOne(
    { _id: req.user!.userId },
    { $addToSet: { prepActivity: todayStart() } }
  );

  const progress = calculateProgress(module as IPrepModule);

  res.json({
    status: 'success',
    data: {
      module,
      progress,
      streak: await getStreak(req.user!.userId), // Consecutive days
    },
  });
}

// DELETE /api/v1/prep/:id/subtopics/:subtopicIndex
export async function deleteSubtopic(req: Request, res: Response) {
  const module = await getOwnedModule(req.user!.userId, req.params.id);
  const index = Number(req.params.subtopicIndex);
  if (!Number.isInteger(index) || index < 0 || index >= module.subtopics.length) {
    throw new ApiError(404, 'NOT_FOUND', 'Subtopic not found');
  }
  module.subtopics.splice(index, 1);
  await module.save();
  res.json({ status: 'success', data: { ...module.toJSON(), progress: calculateProgress(module) } });
}

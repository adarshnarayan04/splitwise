import { Request, Response, NextFunction } from "express";
import {
  createGroup as createGroupRecord,
  addMember as addMemberRecord,
  getGroup as getGroupRecord,
  getExpensesForGroup,
  getSettlementsForGroup,
} from "../lib/store.js";

async function requireGroup(groupId: string) {
  const group = await getGroupRecord(groupId);
  if (!group) {
    const err: any = new Error("Group not found");
    err.status = 404;
    throw err;
  }
  return group;
}

function assertMembers(
  group: { members: { userId: string }[] },
  userIds: string[]
) {
  const memberIds = new Set(group.members.map((m) => m.userId));
  userIds.forEach((uid) => {
    if (!memberIds.has(uid)) {
      const err: any = new Error(`User ${uid} is not in group`);
      err.status = 400;
      throw err;
    }
  });
}

export async function createGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { name, currency, members } = req.body;
    if (!name || !currency) {
      const err: any = new Error("name and currency are required");
      err.status = 400;
      throw err;
    }
    const group = await createGroupRecord({
      name,
      currency,
      createdById: (req as any).user.userId,
      members: members || [],
    });
    return res.status(201).json(group);
  } catch (err) {
    return next(err);
  }
}

export async function addMember(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { userId, role } = req.body;
    if (!userId) {
      const err: any = new Error("userId is required");
      err.status = 400;
      throw err;
    }
    const group = await requireGroup(req.params.groupId);
    await addMemberRecord(group.id, userId, role || "member");
    const updated = await requireGroup(req.params.groupId);
    return res
      .status(201)
      .json({ groupId: updated.id, members: updated.members });
  } catch (err) {
    return next(err);
  }
}

export async function getGroup(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const group = await requireGroup(req.params.groupId);
    return res.json({
      id: group.id,
      name: group.name,
      currency: group.currency,
      createdById: group.createdById,
      members: group.members,
    });
  } catch (err) {
    return next(err);
  }
}

export async function getLedger(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    await requireGroup(req.params.groupId);
    const expenses = await getExpensesForGroup(req.params.groupId);
    const settlements = await getSettlementsForGroup(req.params.groupId);
    return res.json({ expenses, settlements });
  } catch (err) {
    return next(err);
  }
}

export { requireGroup, assertMembers };

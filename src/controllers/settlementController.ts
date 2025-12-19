import { Request, Response, NextFunction } from "express";
import { createSettlement as createSettlementRecord } from "../lib/store.js";
import { requireGroup, assertMembers } from "./groupController.js";
import { notifySettlementRecorded } from "../services/notificationService.js";

export async function createSettlement(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const group = await requireGroup(req.params.groupId);
    const { fromUserId, toUserId, amountCents, note } = req.body;
    if (
      !fromUserId ||
      !toUserId ||
      !Number.isInteger(amountCents) ||
      amountCents <= 0
    ) {
      const err: any = new Error(
        "fromUserId, toUserId, and positive integer amountCents are required"
      );
      err.status = 400;
      throw err;
    }
    assertMembers(group, [fromUserId, toUserId]);
    const settlement = await createSettlementRecord({
      groupId: group.id,
      fromUserId,
      toUserId,
      amountCents,
      note,
    });

    await notifySettlementRecorded({ groupName: group.name, settlement });
    return res.status(201).json(settlement);
  } catch (err) {
    return next(err);
  }
}

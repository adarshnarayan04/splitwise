import { Request, Response, NextFunction } from "express";
import { createExpense as createExpenseRecord } from "../lib/store.js";
import { computeShares } from "../lib/split.js";
import { requireGroup, assertMembers } from "./groupController.js";
import { notifyExpenseCreated } from "../services/notificationService.js";

export async function createExpense(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const group = await requireGroup(req.params.groupId);
    const {
      description,
      totalCents,
      paidByUserId,
      paidByShares,
      splitType,
      participants,
      exactShares,
      percentages,
      metadata,
    } = req.body;

    if (!description || !splitType || !Number.isInteger(totalCents)) {
      const err: any = new Error(
        "description, splitType, and integer totalCents are required"
      );
      err.status = 400;
      throw err;
    }

    let payerShares = null as any[] | null;
    if (paidByShares && paidByShares.length > 0) {
      assertMembers(
        group,
        paidByShares.map((p: any) => p.userId)
      );
      const sum = paidByShares.reduce(
        (acc: number, s: any) => acc + s.amountCents,
        0
      );
      if (sum !== totalCents) {
        const err: any = new Error("paidByShares must sum to totalCents");
        err.status = 400;
        throw err;
      }
      payerShares = paidByShares;
    } else {
      if (!paidByUserId) {
        const err: any = new Error(
          "paidByUserId is required when paidByShares is not provided"
        );
        err.status = 400;
        throw err;
      }
      assertMembers(group, [paidByUserId]);
    }

    const participantIds =
      participants ||
      (exactShares ? exactShares.map((s: any) => s.userId) : null) ||
      (percentages ? percentages.map((p: any) => p.userId) : null) ||
      [];

    if (participantIds.length === 0) {
      const err: any = new Error("participants are required");
      err.status = 400;
      throw err;
    }

    assertMembers(group, participantIds);

    const shares = computeShares({
      splitType,
      totalCents,
      participants: participantIds,
      exactShares,
      percentages,
    });

    const expense = await createExpenseRecord({
      groupId: group.id,
      description,
      totalCents,
      splitType,
      shares,
      paidByUserId,
      paidByShares: payerShares,
      metadata,
    });

    await notifyExpenseCreated({
      groupName: group.name,
      expense,
      participantIds,
    });

    return res.status(201).json(expense);
  } catch (err) {
    return next(err);
  }
}

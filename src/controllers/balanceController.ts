import { Request, Response, NextFunction } from "express";
import { computeGroupBalance } from "../lib/balance.js";

export async function getBalances(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const result = await computeGroupBalance(req.params.groupId);
    return res.json(result);
  } catch (err) {
    return next(err);
  }
}

import express from "express";
import { authMiddleware } from "../middlewares/authMiddleware.js";
import {
  createGroup,
  addMember,
  getGroup,
  getLedger,
} from "../controllers/groupController.js";
import { createExpense } from "../controllers/expenseController.js";
import { createSettlement } from "../controllers/settlementController.js";
import { getBalances } from "../controllers/balanceController.js";

const router = express.Router();

router.use(authMiddleware);
router.post("/", createGroup);
router.post("/:groupId/members", addMember);
router.post("/:groupId/expenses", createExpense);
router.post("/:groupId/settlements", createSettlement);
router.get("/:groupId/balances", getBalances);
router.get("/:groupId/ledger", getLedger);
router.get("/:groupId", getGroup);

export default router;

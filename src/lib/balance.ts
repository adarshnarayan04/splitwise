import {
  getGroup,
  getExpensesForGroup,
  getSettlementsForGroup,
} from "./store.js";
import { Expense, Settlement } from "@prisma/client";

type PerUser = {
  [userId: string]: {
    advanced: number;
    owed: number;
    net: number;
    role?: string;
  };
};

function initializePerUser(group: {
  members: { userId: string; role: string }[];
}): PerUser {
  const perUser: PerUser = {};
  group.members.forEach((member) => {
    const userId = member.userId;
    const role = member.role;
    perUser[userId] = { advanced: 0, owed: 0, net: 0, role };
  });
  return perUser;
}

function applyExpense(
  perUser: PerUser,
  expense: Expense & { shares: { userId: string; amountCents: number }[] }
) {
  if (expense.paidByShares && Array.isArray(expense.paidByShares)) {
    (expense.paidByShares as { userId: string; amountCents: number }[]).forEach(
      (share) => {
        if (!perUser[share.userId])
          perUser[share.userId] = { advanced: 0, owed: 0, net: 0 };
        perUser[share.userId].advanced += share.amountCents;
      }
    );
  } else if (expense.paidByUserId) {
    if (!perUser[expense.paidByUserId])
      perUser[expense.paidByUserId] = { advanced: 0, owed: 0, net: 0 };
    perUser[expense.paidByUserId].advanced += expense.totalCents;
  }

  expense.shares.forEach((share) => {
    if (!perUser[share.userId])
      perUser[share.userId] = { advanced: 0, owed: 0, net: 0 };
    perUser[share.userId].owed += share.amountCents;
  });
}

function applySettlements(perUser: PerUser, settlements: Settlement[]) {
  settlements.forEach((s) => {
    if (!perUser[s.fromUserId])
      perUser[s.fromUserId] = { advanced: 0, owed: 0, net: 0 };
    if (!perUser[s.toUserId])
      perUser[s.toUserId] = { advanced: 0, owed: 0, net: 0 };
    perUser[s.fromUserId].net -= s.amountCents;
    perUser[s.toUserId].net += s.amountCents;
  });
}

function computeNet(perUser: PerUser) {
  Object.values(perUser).forEach((entry) => {
    entry.net += entry.advanced - entry.owed;
  });
}

function simplify(perUser: PerUser) {
  const creditors: { userId: string; net: number }[] = [];
  const debtors: { userId: string; net: number }[] = [];
  Object.entries(perUser).forEach(([userId, entry]) => {
    if (entry.net > 0) creditors.push({ userId, net: entry.net });
    if (entry.net < 0) debtors.push({ userId, net: entry.net });
  });

  creditors.sort((a, b) => b.net - a.net || a.userId.localeCompare(b.userId));
  debtors.sort((a, b) => a.net - b.net || a.userId.localeCompare(b.userId));

  const transfers: { from: string; to: string; amountCents: number }[] = [];
  while (creditors.length && debtors.length) {
    const creditor = creditors[0];
    const debtor = debtors[0];
    const amount = Math.min(creditor.net, -debtor.net);
    transfers.push({
      from: debtor.userId,
      to: creditor.userId,
      amountCents: amount,
    });
    creditor.net -= amount;
    debtor.net += amount;
    if (creditor.net === 0) creditors.shift();
    if (debtor.net === 0) debtors.shift();
    creditors.sort((a, b) => b.net - a.net || a.userId.localeCompare(b.userId));
    debtors.sort((a, b) => a.net - b.net || a.userId.localeCompare(b.userId));
  }
  return transfers;
}

async function computeGroupBalance(groupId: string) {
  const group = await getGroup(groupId);
  if (!group) {
    const err = new Error("Group not found") as Error & { status?: number };
    err.status = 404;
    throw err;
  }
  const perUser = initializePerUser(group);
  const expenses = await getExpensesForGroup(groupId);
  const settlements = await getSettlementsForGroup(groupId);

  expenses.forEach((expense) => applyExpense(perUser, expense as any));
  computeNet(perUser);
  applySettlements(perUser, settlements);

  const simplified = simplify(perUser);
  return { perUser, simplified };
}

export { computeGroupBalance };

import { sendEmail } from "./mailer.js";
import { findUsersByIds, findUserById } from "../lib/store.js";
import { Expense, Settlement } from "@prisma/client";

export async function notifyExpenseCreated({
  groupName,
  expense,
  participantIds,
}: {
  groupName: string;
  expense: Expense;
  participantIds: string[];
}) {
  const subject = `New expense in ${groupName}: ${expense.description}`;
  const text = `A new expense was added:\n- Description: ${
    expense.description
  }\n- Total: ${expense.totalCents / 100}\n- Split type: ${expense.splitType}`;
  const participants = await findUsersByIds(participantIds);
  const emails = participants.map((u) => u.email).filter(Boolean);
  await sendEmail({ to: emails as string[], subject, text });
}

export async function notifySettlementRecorded({
  groupName,
  settlement,
}: {
  groupName: string;
  settlement: Settlement;
}) {
  const subject = `Settlement recorded in ${groupName}`;
  const text = `A settlement was recorded:\n- From: ${
    settlement.fromUserId
  }\n- To: ${settlement.toUserId}\n- Amount: ${settlement.amountCents / 100}`;
  const users = await findUsersByIds([
    settlement.fromUserId,
    settlement.toUserId,
  ]);
  const emails = users.map((u) => u.email).filter(Boolean);
  await sendEmail({ to: emails as string[], subject, text });
}

export async function resolveUsers(ids: string[]) {
  const unique = Array.from(new Set(ids));
  return findUsersByIds(unique);
}

export async function resolveUser(id: string) {
  return findUserById(id);
}

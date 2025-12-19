import {
  Prisma,
  PrismaClient,
  Expense,
  Group,
  Settlement,
  User,
} from "@prisma/client";
import { prisma } from "./prisma.js";

type MemberInput = { userId: string; role?: "admin" | "member" };
type ShareInput = { userId: string; amountCents: number };
type PayerShareInput = ShareInput;

type CreateExpenseInput = {
  groupId: string;
  description: string;
  totalCents: number;
  splitType: "EQUAL" | "EXACT" | "PERCENT";
  shares: ShareInput[];
  paidByUserId?: string | null;
  paidByShares?: PayerShareInput[] | null;
  metadata?: Record<string, unknown> | null;
};

type ExpenseWithShares = Prisma.ExpenseGetPayload<{
  include: { shares: true };
}>;

type CreateSettlementInput = {
  groupId: string;
  fromUserId: string;
  toUserId: string;
  amountCents: number;
  note?: string | null;
};

async function createUser({
  email,
  name,
  passwordHash,
}: {
  email: string;
  name: string;
  passwordHash: string;
}): Promise<User> {
  return prisma.user.create({ data: { email, name, passwordHash } });
}

async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

async function findUsersByIds(ids: string[]): Promise<User[]> {
  if (!ids || ids.length === 0) return [];
  return prisma.user.findMany({ where: { id: { in: ids } } });
}

async function createGroup({
  name,
  currency,
  createdById,
  members = [],
}: {
  name: string;
  currency: string;
  createdById: string;
  members?: MemberInput[];
}): Promise<Group & { members: any[] }> {
  return prisma.group.create({
    data: {
      name,
      currency,
      createdById,
      members: {
        create: [
          { userId: createdById, role: "admin" },
          ...members.map((m) => ({
            userId: m.userId,
            role: m.role || "member",
          })),
        ],
      },
    },
    include: { members: true },
  });
}

async function getGroup(
  groupId: string
): Promise<(Group & { members: any[] }) | null> {
  return prisma.group.findUnique({
    where: { id: groupId },
    include: { members: true },
  });
}

async function addMember(
  groupId: string,
  userId: string,
  role: "admin" | "member" = "member"
) {
  return prisma.groupMember.create({ data: { groupId, userId, role } });
}

async function createExpense({
  groupId,
  description,
  totalCents,
  splitType,
  shares,
  paidByUserId,
  paidByShares,
  metadata,
}: CreateExpenseInput): Promise<ExpenseWithShares> {
  return prisma.expense.create({
    data: {
      groupId,
      description,
      totalCents,
      splitType,
      paidByUserId: paidByUserId || null,
      paidByShares: (paidByShares ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
      metadata: (metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      shares: {
        create: shares.map((s) => ({
          userId: s.userId,
          amountCents: s.amountCents,
        })),
      },
    },
    include: { shares: true },
  });
}

async function getExpensesForGroup(groupId: string) {
  return prisma.expense.findMany({
    where: { groupId },
    include: { shares: true },
  });
}

async function createSettlement({
  groupId,
  fromUserId,
  toUserId,
  amountCents,
  note,
}: CreateSettlementInput): Promise<Settlement> {
  return prisma.settlement.create({
    data: { groupId, fromUserId, toUserId, amountCents, note: note || null },
  });
}

async function getSettlementsForGroup(groupId: string) {
  return prisma.settlement.findMany({ where: { groupId } });
}

export {
  prisma,
  createUser,
  findUserByEmail,
  findUserById,
  findUsersByIds,
  createGroup,
  getGroup,
  addMember,
  createExpense,
  getExpensesForGroup,
  createSettlement,
  getSettlementsForGroup,
};

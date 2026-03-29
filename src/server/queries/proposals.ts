import { ProposalStatus } from "@prisma/client";
import { prisma } from "@/lib/db";

const proposalInclude = {
  order: {
    select: {
      id: true,
      title: true,
      status: true,
      visibilityType: true,
      executorId: true,
      customer: { select: { email: true } },
    },
  },
  executor: { select: { id: true, email: true } },
} as const;

export async function listPendingProposalsForAdmin() {
  return prisma.proposal.findMany({
    where: { status: ProposalStatus.PENDING },
    orderBy: { createdAt: "desc" },
    include: proposalInclude,
  });
}

export async function listRecentResolvedProposalsForAdmin(take = 40) {
  return prisma.proposal.findMany({
    where: { status: { not: ProposalStatus.PENDING } },
    orderBy: { updatedAt: "desc" },
    take,
    include: proposalInclude,
  });
}

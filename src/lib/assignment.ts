import "server-only";
import { db } from "@/lib/db";

const DEFAULT_RULE_NAME = "Default Round Robin";

export async function getDefaultAssignmentRule() {
  const rule = await db.assignmentRule.findFirst({
    where: { name: DEFAULT_RULE_NAME },
    include: { members: { include: { user: true }, orderBy: { order: "asc" } } },
  });
  return rule;
}

export async function upsertDefaultAssignmentRule(isActive: boolean, memberIds: string[]) {
  const existing = await db.assignmentRule.findFirst({ where: { name: DEFAULT_RULE_NAME } });

  const rule = existing
    ? await db.assignmentRule.update({ where: { id: existing.id }, data: { isActive } })
    : await db.assignmentRule.create({
        data: { name: DEFAULT_RULE_NAME, method: "ROUND_ROBIN", isActive },
      });

  await db.assignmentRuleMember.deleteMany({ where: { ruleId: rule.id } });
  await db.assignmentRuleMember.createMany({
    data: memberIds.map((userId, index) => ({ ruleId: rule.id, userId, order: index })),
  });

  return getDefaultAssignmentRule();
}

/** Picks the next user in rotation and advances the rule's pointer. Returns null if no active rule/members. */
export async function getNextRoundRobinAssignee(): Promise<string | null> {
  const rule = await getDefaultAssignmentRule();
  if (!rule || !rule.isActive || rule.members.length === 0) return null;

  const nextIndex = (rule.lastAssignedIndex + 1) % rule.members.length;
  await db.assignmentRule.update({
    where: { id: rule.id },
    data: { lastAssignedIndex: nextIndex },
  });

  return rule.members[nextIndex].userId;
}

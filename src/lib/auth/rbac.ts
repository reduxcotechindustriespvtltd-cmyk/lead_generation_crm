import type { UserRole } from "@/generated/prisma/client";

export const permissions = {
  viewAllLeads: (role: UserRole) => role === "ADMIN" || role === "MANAGER",
  deleteLead: (role: UserRole) => role === "ADMIN" || role === "MANAGER",
  reassignLeads: (role: UserRole) => role === "ADMIN" || role === "MANAGER",
  bulkAssignLeads: (role: UserRole) => role === "ADMIN" || role === "MANAGER",
  manageUsers: (role: UserRole) => role === "ADMIN",
  manageLeadStatuses: (role: UserRole) => role === "ADMIN",
  manageMetaAccounts: (role: UserRole) => role === "ADMIN",
  viewFullAnalytics: (role: UserRole) => role === "ADMIN" || role === "MANAGER",
  exportLeads: (role: UserRole) => role === "ADMIN" || role === "MANAGER",
  deleteBooking: (role: UserRole) => role === "ADMIN" || role === "MANAGER",
};

export type Permission = keyof typeof permissions;

export function can(role: UserRole, permission: Permission): boolean {
  return permissions[permission](role);
}

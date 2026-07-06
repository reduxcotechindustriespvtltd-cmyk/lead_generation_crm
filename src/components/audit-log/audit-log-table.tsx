"use client";

import { Fragment, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ShieldAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils";

const ALL = "__all__";
const SENSITIVE_ACTIONS = new Set([
  "REFRESH_TOKEN_REUSE_DETECTED",
  "USER_PASSWORD_RESET",
  "PASSWORD_CHANGED",
  "USER_UPDATED",
  "META_ACCOUNT_DISCONNECTED",
]);

type AuditLogRow = {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  changes: unknown;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: { id: string; name: string; email: string } | null;
};

export function AuditLogTable({
  logs,
  total,
  page,
  pageSize,
  totalPages,
  availableActions,
}: {
  logs: AuditLogRow[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  availableActions: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function updateParams(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === ALL) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-col gap-3">
      <Select
        value={searchParams.get("action") ?? ALL}
        onValueChange={(v) => updateParams({ action: v, page: null })}
      >
        <SelectTrigger className="w-[240px]">
          <SelectValue placeholder="All actions">
            {(v: string) => (v === ALL ? "All actions" : v)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All actions</SelectItem>
          {availableActions.map((action) => (
            <SelectItem key={action} value={action}>
              {action}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Entity</TableHead>
              <TableHead>IP</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-40 text-center">
                  <EmptyState icon={ShieldAlert} title="No audit log entries yet" size="sm" />
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => {
                const isExpanded = expandedId === log.id;
                const hasDetails = log.changes != null || log.userAgent;
                return (
                  <Fragment key={log.id}>
                    <TableRow
                      key={log.id}
                      className={cn(hasDetails && "cursor-pointer")}
                      onClick={() => hasDetails && setExpandedId(isExpanded ? null : log.id)}
                    >
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {format(new Date(log.createdAt), "d MMM yyyy, h:mm:ss a")}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.user ? (
                          <>
                            <div>{log.user.name}</div>
                            <div className="text-muted-foreground text-xs">{log.user.email}</div>
                          </>
                        ) : (
                          <span className="text-muted-foreground">System</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={SENSITIVE_ACTIONS.has(log.action) ? "destructive" : "secondary"}
                        >
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.entityType}
                        {log.entityId && `#${log.entityId.slice(-6)}`}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {log.ipAddress ?? "—"}
                      </TableCell>
                      <TableCell>
                        {hasDetails &&
                          (isExpanded ? (
                            <ChevronUp className="text-muted-foreground size-4" />
                          ) : (
                            <ChevronDown className="text-muted-foreground size-4" />
                          ))}
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${log.id}-details`}>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="flex flex-col gap-1 py-2 text-xs">
                            {log.userAgent && (
                              <p>
                                <span className="text-muted-foreground">User agent: </span>
                                {log.userAgent}
                              </p>
                            )}
                            {log.changes != null && (
                              <pre className="bg-background overflow-x-auto rounded p-2">
                                {JSON.stringify(log.changes, null, 2)}
                              </pre>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-muted-foreground flex items-center justify-between text-sm">
        <span>
          Showing {logs.length === 0 ? 0 : (page - 1) * pageSize + 1}–
          {Math.min(page * pageSize, total)} of {total} entries
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            <ChevronLeft className="size-4" />
            Previous
          </Button>
          <span>
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            Next
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

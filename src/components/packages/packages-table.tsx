"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, PackageIcon, Trash2 } from "lucide-react";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PackageFormDialog, type PackageRow } from "@/components/packages/package-form-dialog";

export function PackagesTable({ packages }: { packages: PackageRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<PackageRow | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete package "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/packages/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Package deleted");
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Package</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Max Guests</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {packages.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-40 text-center">
                <EmptyState
                  icon={PackageIcon}
                  title="No packages yet"
                  description="Add a package to show it on the gsb-holidays Packages page."
                  size="sm"
                />
              </TableCell>
            </TableRow>
          ) : (
            packages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- served from local storage, not next/image-optimizable */}
                  <img
                    src={`/api/public/files/${pkg.imagePath}`}
                    alt={pkg.name}
                    className="size-10 shrink-0 rounded-md object-cover"
                  />
                  <div className="font-medium">{pkg.name}</div>
                </TableCell>
                <TableCell className="text-sm">{pkg.type}</TableCell>
                <TableCell className="text-sm">
                  ₹{Number(pkg.price).toLocaleString("en-IN")} {pkg.priceUnit}
                </TableCell>
                <TableCell className="text-sm">{pkg.maxGuests}</TableCell>
                <TableCell>
                  <Badge variant={pkg.isActive ? "default" : "secondary"}>
                    {pkg.isActive ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{pkg.order}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(pkg)}>Edit package</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(pkg.id, pkg.name)}>
                        <Trash2 />
                        Delete package
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {editing && (
        <PackageFormDialog
          mode="edit"
          pkg={editing}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}
    </div>
  );
}

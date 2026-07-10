"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MessageSquareQuote, MoreHorizontal, Star, Trash2 } from "lucide-react";

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
import {
  TestimonialFormDialog,
  type TestimonialRow,
} from "@/components/testimonials/testimonial-form-dialog";

export function TestimonialsTable({ testimonials }: { testimonials: TestimonialRow[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<TestimonialRow | null>(null);

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete testimonial from "${name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/testimonials/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Testimonial deleted");
    router.refresh();
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>Rating</TableHead>
            <TableHead>Quote</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Order</TableHead>
            <TableHead className="w-10" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {testimonials.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <EmptyState
                  icon={MessageSquareQuote}
                  title="No testimonials yet"
                  description="Add a testimonial to show it on the gsb-holidays homepage."
                  size="sm"
                />
              </TableCell>
            </TableRow>
          ) : (
            testimonials.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <div className="font-medium">{t.name}</div>
                  <div className="text-muted-foreground text-xs">{t.location}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`size-3.5 ${i < t.rating ? "fill-current" : "text-muted-foreground"}`}
                      />
                    ))}
                  </div>
                </TableCell>
                <TableCell className="max-w-xs truncate text-sm">{t.quote}</TableCell>
                <TableCell>
                  <Badge variant={t.isActive ? "default" : "secondary"}>
                    {t.isActive ? "Active" : "Hidden"}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm">{t.order}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger render={<Button variant="ghost" size="icon" className="size-7" />}>
                      <MoreHorizontal className="size-4" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(t)}>Edit testimonial</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => handleDelete(t.id, t.name)}>
                        <Trash2 />
                        Delete testimonial
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
        <TestimonialFormDialog
          mode="edit"
          testimonial={editing}
          open={!!editing}
          onOpenChange={(v) => !v && setEditing(null)}
        />
      )}
    </div>
  );
}

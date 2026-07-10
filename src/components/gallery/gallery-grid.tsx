"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImageOff, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";

export type GalleryImageRow = {
  id: string;
  imagePath: string;
  caption: string | null;
  isActive: boolean;
  order: number;
};

async function patchImage(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/gallery/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Update failed");
  }
}

export function GalleryGrid({ images }: { images: GalleryImageRow[] }) {
  const router = useRouter();

  async function handleCaptionBlur(id: string, caption: string) {
    try {
      await patchImage(id, { caption });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await patchImage(id, { isActive });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleReorder(index: number, direction: -1 | 1) {
    const target = images[index + direction];
    const current = images[index];
    if (!target) return;
    try {
      await Promise.all([
        patchImage(current.id, { order: target.order }),
        patchImage(target.id, { order: current.order }),
      ]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reorder failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this gallery image? This cannot be undone.")) return;
    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Image deleted");
    router.refresh();
  }

  if (images.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyState
          icon={ImageOff}
          title="No gallery images yet"
          description="Upload a photo to show it on the gsb-holidays Gallery page."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {images.map((image, index) => (
        <div key={image.id} className="flex flex-col gap-2 rounded-lg border p-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- served from local storage, not next/image-optimizable */}
          <img
            src={`/api/public/files/${image.imagePath}`}
            alt={image.caption ?? "Gallery photo"}
            className="h-40 w-full rounded-md object-cover"
          />
          <Input
            defaultValue={image.caption ?? ""}
            placeholder="Caption (optional)"
            onBlur={(e) => handleCaptionBlur(image.id, e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={image.isActive}
                onCheckedChange={(checked) => handleToggleActive(image.id, checked)}
              />
              <span className="text-muted-foreground text-xs">
                {image.isActive ? "Active" : "Hidden"}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={index === 0}
                onClick={() => handleReorder(index, -1)}
              >
                <ArrowUp className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7"
                disabled={index === images.length - 1}
                onClick={() => handleReorder(index, 1)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive size-7"
                onClick={() => handleDelete(image.id)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

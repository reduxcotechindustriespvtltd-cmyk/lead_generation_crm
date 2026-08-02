"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2, VideoOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { EmptyState } from "@/components/ui/empty-state";

export type GalleryVideoRow = {
  id: string;
  url: string;
  caption: string | null;
  isActive: boolean;
  order: number;
};

async function patchVideo(id: string, data: Record<string, unknown>) {
  const res = await fetch(`/api/gallery-videos/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "Update failed");
  }
}

export function GalleryVideoGrid({ videos }: { videos: GalleryVideoRow[] }) {
  const router = useRouter();

  async function handleCaptionBlur(id: string, caption: string) {
    try {
      await patchVideo(id, { caption });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      await patchVideo(id, { isActive });
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Update failed");
    }
  }

  async function handleReorder(index: number, direction: -1 | 1) {
    const target = videos[index + direction];
    const current = videos[index];
    if (!target) return;
    try {
      await Promise.all([
        patchVideo(current.id, { order: target.order }),
        patchVideo(target.id, { order: current.order }),
      ]);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Reorder failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this gallery video? This cannot be undone.")) return;
    const res = await fetch(`/api/gallery-videos/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      toast.error(err.error ?? "Delete failed");
      return;
    }
    toast.success("Video deleted");
    router.refresh();
  }

  if (videos.length === 0) {
    return (
      <div className="rounded-lg border">
        <EmptyState
          icon={VideoOff}
          title="No gallery videos yet"
          description="Upload a video to show it on the gsb-holidays site."
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video, index) => (
        <div key={video.id} className="flex flex-col gap-2 rounded-lg border p-3">
          <video src={video.url} controls className="h-40 w-full rounded-md object-cover" />
          <Input
            defaultValue={video.caption ?? ""}
            placeholder="Caption (optional)"
            onBlur={(e) => handleCaptionBlur(video.id, e.target.value)}
          />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={video.isActive}
                onCheckedChange={(checked) => handleToggleActive(video.id, checked)}
              />
              <span className="text-muted-foreground text-xs">
                {video.isActive ? "Active" : "Hidden"}
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
                disabled={index === videos.length - 1}
                onClick={() => handleReorder(index, 1)}
              >
                <ArrowDown className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive size-7"
                onClick={() => handleDelete(video.id)}
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

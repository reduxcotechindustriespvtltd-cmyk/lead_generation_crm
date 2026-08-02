import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listGalleryVideos } from "@/lib/queries/gallery-videos";
import { getSupabasePublicUrl } from "@/lib/storage/supabase-file-storage";
import { GalleryVideoUploadDialog } from "@/components/gallery/gallery-video-upload-dialog";
import { GalleryVideoGrid } from "@/components/gallery/gallery-video-grid";

export default async function VideosAdminPage() {
  const session = await getCurrentUser();
  if (!session || !can(session.role, "manageContent")) {
    redirect("/dashboard");
  }

  const videos = await listGalleryVideos();
  const rows = videos.map((video) => ({
    id: video.id,
    url: getSupabasePublicUrl(video.videoPath),
    caption: video.caption,
    isActive: video.isActive,
    order: video.order,
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Videos</h1>
          <p className="text-muted-foreground text-sm">
            {rows.length} video{rows.length === 1 ? "" : "s"} — controls the gsb-holidays site&apos;s videos
          </p>
        </div>
        <GalleryVideoUploadDialog />
      </div>
      <GalleryVideoGrid videos={rows} />
    </div>
  );
}

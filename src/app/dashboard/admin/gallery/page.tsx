import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listGalleryImages } from "@/lib/queries/gallery";
import { GalleryUploadDialog } from "@/components/gallery/gallery-upload-dialog";
import { GalleryGrid } from "@/components/gallery/gallery-grid";

export default async function GalleryAdminPage() {
  const session = await getCurrentUser();
  if (!session || !can(session.role, "manageContent")) {
    redirect("/dashboard");
  }

  const images = await listGalleryImages();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
          <p className="text-muted-foreground text-sm">
            {images.length} photo{images.length === 1 ? "" : "s"} — controls the gsb-holidays Gallery page
          </p>
        </div>
        <GalleryUploadDialog />
      </div>
      <GalleryGrid images={images} />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listPackages } from "@/lib/queries/packages";
import { PackagesToolbar } from "@/components/packages/packages-toolbar";
import { PackagesTable } from "@/components/packages/packages-table";

export default async function PackagesAdminPage() {
  const session = await getCurrentUser();
  if (!session || !can(session.role, "manageContent")) {
    redirect("/dashboard");
  }

  const packages = await listPackages();
  const rows = packages.map((pkg) => ({
    id: pkg.id,
    name: pkg.name,
    type: pkg.type,
    price: pkg.price.toString(),
    priceUnit: pkg.priceUnit,
    maxGuests: pkg.maxGuests,
    description: pkg.description,
    amenities: pkg.amenities,
    imagePath: pkg.imagePath,
    videoUrl: pkg.videoUrl,
    isActive: pkg.isActive,
    order: pkg.order,
    images: pkg.images.map((img) => ({ id: img.id, imagePath: img.imagePath })),
  }));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Packages</h1>
          <p className="text-muted-foreground text-sm">
            {rows.length} package{rows.length === 1 ? "" : "s"} — controls the gsb-holidays Packages page
          </p>
        </div>
        <PackagesToolbar />
      </div>
      <PackagesTable packages={rows} />
    </div>
  );
}

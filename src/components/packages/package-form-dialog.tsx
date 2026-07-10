"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, X } from "lucide-react";

import { packageFormSchema, type PackageFormValues } from "@/lib/validations/packages";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export type PackageRow = {
  id: string;
  name: string;
  type: string;
  price: string;
  priceUnit: string;
  maxGuests: number;
  description: string;
  amenities: string[];
  imagePath: string;
  videoUrl: string | null;
  isActive: boolean;
  order: number;
  images: { id: string; imagePath: string }[];
};

/** Adds one gallery image to an already-created package — used both by the create flow (right after the package exists) and the edit flow. */
async function uploadGalleryImages(packageId: string, files: File[]) {
  const formData = new FormData();
  for (const file of files) formData.append("images", file);
  const res = await fetch(`/api/packages/${packageId}/images`, { method: "POST", body: formData });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error ?? "Failed to upload images");
  }
}

export function PackageFormDialog({
  mode,
  pkg,
  open,
  onOpenChange,
}: {
  mode: "create" | "edit";
  pkg?: PackageRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [deletingImageId, setDeletingImageId] = useState<string | null>(null);

  const form = useForm<PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: pkg
      ? {
          name: pkg.name,
          type: pkg.type,
          price: Number(pkg.price),
          priceUnit: pkg.priceUnit,
          maxGuests: pkg.maxGuests,
          description: pkg.description,
          amenities: pkg.amenities.join("\n"),
          videoUrl: pkg.videoUrl ?? "",
          isActive: pkg.isActive,
          order: pkg.order,
        }
      : {
          name: "",
          type: "",
          price: 0,
          priceUnit: "per night",
          maxGuests: 2,
          description: "",
          amenities: "",
          videoUrl: "",
          isActive: true,
          order: 0,
        },
  });

  async function handleDeleteExistingImage(imageId: string) {
    if (!pkg) return;
    setDeletingImageId(imageId);
    try {
      const res = await fetch(`/api/packages/${pkg.id}/images/${imageId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to remove image");
        return;
      }
      router.refresh();
    } finally {
      setDeletingImageId(null);
    }
  }

  async function onSubmit(values: PackageFormValues) {
    if (mode === "create" && !file) {
      form.setError("root", { message: "An image is required" });
      return;
    }

    setIsSubmitting(true);
    try {
      const amenities = values.amenities
        .split("\n")
        .map((a) => a.trim())
        .filter(Boolean);

      const formData = new FormData();
      formData.set("name", values.name);
      formData.set("type", values.type);
      formData.set("price", String(values.price));
      formData.set("priceUnit", values.priceUnit);
      formData.set("maxGuests", String(values.maxGuests));
      formData.set("description", values.description);
      formData.set("amenities", JSON.stringify(amenities));
      formData.set("videoUrl", values.videoUrl.trim());
      formData.set("isActive", String(values.isActive));
      formData.set("order", String(values.order));
      if (file) formData.set("image", file);
      if (mode === "create") {
        for (const galleryFile of galleryFiles) formData.append("images", galleryFile);
      }

      const res = await fetch(mode === "create" ? "/api/packages" : `/api/packages/${pkg!.id}`, {
        method: mode === "create" ? "POST" : "PATCH",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error ?? "Failed to save package");
        return;
      }

      // In edit mode, newly-picked gallery files aren't in the main PATCH body — upload them separately.
      if (mode === "edit" && galleryFiles.length > 0) {
        try {
          await uploadGalleryImages(pkg!.id, galleryFiles);
        } catch (error) {
          toast.error(error instanceof Error ? error.message : "Failed to upload images");
        }
      }

      toast.success(mode === "create" ? "Package created" : "Package updated");
      onOpenChange(false);
      if (mode === "create") {
        form.reset();
        setFile(null);
      }
      setGalleryFiles([]);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Add a new package" : "Edit package"}</DialogTitle>
          <DialogDescription>
            Shows up on the gsb-holidays Packages page once active.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="GSB Royal Villa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Villa, Cottage, Glamping..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="maxGuests"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Guests</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        step="0.01"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priceUnit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price Unit</FormLabel>
                    <FormControl>
                      <Input placeholder="per night" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amenities"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Amenities (one per line)</FormLabel>
                    <FormControl>
                      <Textarea rows={3} placeholder={"Private deck\nAC bedrooms\nLake view"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="videoUrl"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Video URL (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://www.youtube.com/watch?v=..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="order"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-col justify-end">
                    <div className="flex items-center justify-between">
                      <Label>Active (visible on site)</Label>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Cover Image</label>
              {pkg?.imagePath && !file && (
                // eslint-disable-next-line @next/next/no-img-element -- served from the CRM's own local-storage route, not next/image-optimizable at build time
                <img
                  src={`/api/public/files/${pkg.imagePath}`}
                  alt={pkg.name}
                  className="h-32 w-full rounded-lg object-cover"
                />
              )}
              <Input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {form.formState.errors.root && (
                <p className="text-destructive text-sm">{form.formState.errors.root.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Gallery Images</label>

              {mode === "edit" && pkg && pkg.images.length > 0 && (
                <div className="grid grid-cols-4 gap-2">
                  {pkg.images.map((img) => (
                    <div key={img.id} className="group relative">
                      {/* eslint-disable-next-line @next/next/no-img-element -- served from the CRM's own local-storage route */}
                      <img
                        src={`/api/public/files/${img.imagePath}`}
                        alt=""
                        className="h-16 w-full rounded-md object-cover"
                      />
                      <button
                        type="button"
                        disabled={deletingImageId === img.id}
                        onClick={() => handleDeleteExistingImage(img.id)}
                        className="bg-destructive absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full text-white opacity-0 transition group-hover:opacity-100 disabled:opacity-60"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {galleryFiles.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {galleryFiles.map((f, i) => (
                    <span
                      key={`${f.name}-${i}`}
                      className="bg-muted flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs"
                    >
                      {f.name}
                      <button
                        type="button"
                        onClick={() => setGalleryFiles((prev) => prev.filter((_, idx) => idx !== i))}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <label className="border-input hover:bg-muted/50 flex w-fit cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm">
                <Plus className="size-4" />
                Add Images
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const picked = Array.from(e.target.files ?? []);
                    setGalleryFiles((prev) => [...prev, ...picked]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                {mode === "create" ? "Create Package" : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

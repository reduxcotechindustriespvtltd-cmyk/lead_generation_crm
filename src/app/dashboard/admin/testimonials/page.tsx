import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/rbac";
import { listTestimonials } from "@/lib/queries/testimonials";
import { TestimonialsToolbar } from "@/components/testimonials/testimonials-toolbar";
import { TestimonialsTable } from "@/components/testimonials/testimonials-table";

export default async function TestimonialsAdminPage() {
  const session = await getCurrentUser();
  if (!session || !can(session.role, "manageContent")) {
    redirect("/dashboard");
  }

  const testimonials = await listTestimonials();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Testimonials</h1>
          <p className="text-muted-foreground text-sm">
            {testimonials.length} testimonial{testimonials.length === 1 ? "" : "s"} — controls the
            gsb-holidays homepage carousel
          </p>
        </div>
        <TestimonialsToolbar />
      </div>
      <TestimonialsTable testimonials={testimonials} />
    </div>
  );
}

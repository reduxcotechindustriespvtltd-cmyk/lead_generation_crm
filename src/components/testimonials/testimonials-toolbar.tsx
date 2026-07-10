"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialFormDialog } from "@/components/testimonials/testimonial-form-dialog";

export function TestimonialsToolbar() {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setAddOpen(true)}>
        <Plus />
        Add Testimonial
      </Button>
      <TestimonialFormDialog mode="create" open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}

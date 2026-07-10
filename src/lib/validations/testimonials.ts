import { z } from "zod";

const rawTestimonialFields = {
  name: z.string().trim().min(1, "Name is required").max(200),
  location: z.string().trim().min(1, "Location is required").max(200),
  rating: z.coerce.number().int().min(1).max(5),
  quote: z.string().trim().min(1, "Quote is required").max(1000),
  isActive: z.coerce.boolean(),
  order: z.coerce.number().int(),
};

export const createTestimonialSchema = z.object({
  ...rawTestimonialFields,
  isActive: rawTestimonialFields.isActive.default(true),
  order: rawTestimonialFields.order.default(0),
});
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;

export const updateTestimonialSchema = z.object({
  name: rawTestimonialFields.name.optional(),
  location: rawTestimonialFields.location.optional(),
  rating: rawTestimonialFields.rating.optional(),
  quote: rawTestimonialFields.quote.optional(),
  isActive: rawTestimonialFields.isActive.optional(),
  order: rawTestimonialFields.order.optional(),
});
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;

export const testimonialFormSchema = z.object({
  name: rawTestimonialFields.name,
  location: rawTestimonialFields.location,
  rating: z.number().int().min(1).max(5),
  quote: rawTestimonialFields.quote,
  isActive: z.boolean(),
  order: z.number().int(),
});
export type TestimonialFormValues = z.infer<typeof testimonialFormSchema>;

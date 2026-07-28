import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(200),
  email: z.string().trim().min(1, "Please enter your email").email("Enter a valid email address"),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(5000),
  // Honeypot: real visitors never fill this in; bots typically do.
  company: z.string().max(0, "Spam detected").optional(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;

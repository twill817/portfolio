import { Resend } from "resend";
import type { ContactFormValues } from "./validation";

export async function sendContactEmail(values: Pick<ContactFormValues, "name" | "email" | "message">) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;

  if (!apiKey || !to) {
    throw new Error(
      "Contact form email is not configured. Set RESEND_API_KEY and CONTACT_TO_EMAIL — see .env.example."
    );
  }

  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({
    from: "Portfolio contact form <onboarding@resend.dev>",
    to,
    replyTo: values.email,
    subject: `New message from ${values.name}`,
    text: `From: ${values.name} <${values.email}>\n\n${values.message}`,
  });

  if (error) {
    throw new Error(error.message);
  }
}

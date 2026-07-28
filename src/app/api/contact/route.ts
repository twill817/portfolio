import { NextResponse } from "next/server";
import { contactFormSchema } from "@/lib/validation";
import { sendContactEmail } from "@/lib/email";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = contactFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the form and try again." }, { status: 400 });
  }

  // Honeypot tripped — pretend success so bots don't learn to avoid it.
  if (parsed.data.company) {
    return NextResponse.json({ ok: true });
  }

  try {
    await sendContactEmail(parsed.data);
  } catch (error) {
    console.error("Failed to send contact email:", error);
    return NextResponse.json(
      { error: "The contact form is not fully configured yet — email was not sent." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}

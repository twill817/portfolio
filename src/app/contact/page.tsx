import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { PageHeading } from "@/components/ui/PageHeading";
import { ContactForm } from "@/components/sections/ContactForm";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Get in touch with ${siteConfig.name}.`,
};

export default function ContactPage() {
  return (
    <Container as="section" className="py-16 sm:py-20">
      <PageHeading
        eyebrow="Contact"
        title="Let's talk about your product"
        description={`Reach out directly at ${siteConfig.email}, or send a message below.`}
      />
      <div className="mt-12 max-w-xl">
        <ContactForm />
      </div>
    </Container>
  );
}

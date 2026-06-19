import { ContactForm } from "@/components/contact/ContactForm";
import { Container } from "@/components/ui/Container";
import { SITE } from "@/lib/constants";

export const metadata = {
  title: "Contact",
  description: "Get in touch with John and Janice about travel tips, collaborations, or just to say hi.",
};

export default function ContactPage() {
  return (
    <Container className="py-12 lg:py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
            Contact us
          </h1>
          <p className="mt-4 text-lg text-muted">
            We love hearing from fellow travelers. Whether you have a question
            about a destination, want to collaborate, or simply want to share
            your own story—we&apos;d love to connect.
          </p>

          <div className="mt-8 space-y-4 text-sm">
            <p>
              <span className="font-semibold text-sage">Email</span>
              <br />
              <a
                href={`mailto:${SITE.email}`}
                className="text-accent hover:underline"
              >
                {SITE.email}
              </a>
            </p>
            <p>
              <span className="font-semibold text-sage">Response time</span>
              <br />
              <span className="text-muted">We typically reply within 2–3 days.</span>
            </p>
          </div>
        </div>

        <ContactForm />
      </div>
    </Container>
  );
}

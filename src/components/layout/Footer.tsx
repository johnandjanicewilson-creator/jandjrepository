import Link from "next/link";
import { NAV_LINKS, SITE, SOCIAL_LINKS } from "@/lib/constants";
import { Container } from "@/components/ui/Container";

function SocialIcon({ icon }: { icon: string }) {
  const paths: Record<string, string> = {
    instagram:
      "M7 2h10a5 5 0 015 5v10a5 5 0 01-5 5H7a5 5 0 01-5-5V7a5 5 0 015-5zm5 12a4 4 0 100-8 4 4 0 000 8zm6.5-9.9a1.1 1.1 0 11-2.2 0 1.1 1.1 0 012.2 0z",
    facebook: "M14 3h3V0h-3c-3.3 0-6 2.7-6 6v3H5v4h3v9h4v-9h3.6l.4-4H12V6c0-.6.4-1 1-1h1z",
    pinterest:
      "M12 2C6.5 2 2 6.5 2 12c0 4.2 2.6 7.8 6.3 9.3-.1-.9-.2-2.3 0-3.3.2-.9 1.3-5.8 1.3-5.8s-.3-.6-.3-1.5c0-1.4.8-2.5 1.8-2.5.8 0 1.2.6 1.2 1.4 0 .9-.6 2.2-.9 3.4-.3 1 .6 1.8 1.6 1.8 1.9 0 3.2-2.4 3.2-5.9 0-2.4-1.6-4.2-4.5-4.2-3.4 0-5.5 2.5-5.5 5.2 0 .9.3 1.9.7 2.4.1.1.1.2.1.3l-.3 1.1c0 .3-.1.4-.4.2-1.6-.7-2.5-3-2.5-4.8 0-3.9 3.3-8.6 9.8-8.6 5.2 0 8.6 3.7 8.6 7.7 0 5.3-3 9.2-7 9.2-1.4 0-2.7-.8-3.1-1.7l-.9 3.2c-.3 1.1-1.1 2.5-1.6 3.4 1.2.4 2.5.6 3.8.6 5.5 0 10-4.5 10-10S17.5 2 12 2z",
    youtube:
      "M21.6 7.2a2.5 2.5 0 00-1.8-1.8C17.8 5 12 5 12 5s-5.8 0-7.8.4A2.5 2.5 0 002.4 7.2 26.3 26.3 0 002 12a26.3 26.3 0 00.4 4.8 2.5 2.5 0 001.8 1.8C6.2 19 12 19 12 19s5.8 0 7.8-.4a2.5 2.5 0 001.8-1.8A26.3 26.3 0 0022 12a26.3 26.3 0 00-.4-4.8zM10 15.5V8.5l5.5 3.5L10 15.5z",
  };

  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d={paths[icon] ?? paths.instagram} />
    </svg>
  );
}

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border bg-sage text-white">
      <Container className="py-12 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <p className="font-display text-2xl font-semibold">
              {SITE.shortName}
            </p>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/80">
              {SITE.description}
            </p>
            <p className="mt-4 text-sm text-white/70">
              Documenting our adventures since {SITE.since}.
            </p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Explore
            </h3>
            <ul className="mt-4 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/75 transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/search"
                  className="text-sm text-white/75 transition hover:text-white"
                >
                  Search
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white/90">
              Connect
            </h3>
            <ul className="mt-4 flex gap-3">
              {SOCIAL_LINKS.map((social) => (
                <li key={social.name}>
                  <a
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-accent"
                    aria-label={social.name}
                  >
                    <SocialIcon icon={social.icon} />
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/75">
              <a
                href={`mailto:${SITE.email}`}
                className="hover:text-white hover:underline"
              >
                {SITE.email}
              </a>
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-white/15 pt-8 text-sm text-white/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {currentYear} {SITE.name}. All rights reserved.
          </p>
          <p>Made with love for travel storytelling.</p>
        </div>
      </Container>
    </footer>
  );
}

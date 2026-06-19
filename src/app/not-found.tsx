import Link from "next/link";
import { Container } from "@/components/ui/Container";

export default function NotFound() {
  return (
    <Container className="flex min-h-[50vh] flex-col items-center justify-center py-20 text-center">
      <p className="text-sm font-semibold uppercase tracking-wider text-accent">
        404
      </p>
      <h1 className="mt-2 font-display text-4xl font-semibold text-sage">
        Page not found
      </h1>
      <p className="mt-3 max-w-md text-muted">
        This trail doesn&apos;t seem to exist. Let&apos;s get you back on the
        map.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full bg-sage px-6 py-3 text-sm font-semibold text-white hover:bg-sage/90"
      >
        Return home
      </Link>
    </Container>
  );
}

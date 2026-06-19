"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const BLOG_NAV_LINKS = [
  { href: "/blog/all", label: "All posts" },
  { href: "/blog", label: "Browse & filter" },
] as const;

export function BlogNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-wrap gap-2", className)}
      aria-label="Blog navigation"
    >
      {BLOG_NAV_LINKS.map((link) => {
        const isActive =
          link.href === "/blog/all"
            ? pathname === "/blog/all"
            : pathname === "/blog";

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-sage text-white"
                : "border border-border bg-card text-foreground hover:border-sage hover:text-sage",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

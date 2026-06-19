import Link from "next/link";
import { playfair, theSignature } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface SiteLogoProps {
  className?: string;
  onClick?: () => void;
}

export function SiteLogo({ className, onClick }: SiteLogoProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group inline-flex shrink-0 flex-col items-center gap-2 text-center text-sage transition-opacity hover:opacity-85 sm:gap-2.5",
        className,
      )}
      onClick={onClick}
      aria-label="Travels With John and Janice — Home"
    >
      <span
        className={cn(
          playfair.className,
          "text-[0.7rem] font-medium tracking-[0.12em] sm:text-xs",
        )}
      >
        Travels With
      </span>
      <span
        className={cn(
          theSignature.className,
          "site-logo-script pb-0.5 text-[1.9rem] leading-[0.85] sm:text-[2.35rem] lg:text-[2.6rem]",
        )}
      >
        John and Janice
      </span>
    </Link>
  );
}

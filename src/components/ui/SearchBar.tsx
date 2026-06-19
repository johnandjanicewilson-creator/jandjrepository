"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  compact?: boolean;
  defaultValue?: string;
}

export function SearchBar({ compact = false, defaultValue = "" }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultValue);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/search?q=${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="w-full">
      <label htmlFor={compact ? "header-search" : "search"} className="sr-only">
        Search posts
      </label>
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          id={compact ? "header-search" : "search"}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search adventures..."
          className={cn(
            "w-full rounded-full border border-border bg-card pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20",
            compact ? "py-2" : "py-3",
          )}
        />
      </div>
    </form>
  );
}

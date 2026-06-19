"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface BlogFiltersProps {
  destinations?: string[];
  years?: number[];
  categories?: string[];
  tags?: string[];
}

function dedupeOptions(
  options: { label: string; value: string }[],
): { label: string; value: string }[] {
  const seen = new Set<string>();
  return options.filter((option) => {
    const key = option.value.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function BlogFilters({
  destinations = [],
  years = [],
  categories = [],
  tags = [],
}: BlogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeDestination = searchParams.get("destination") ?? "";
  const activeYear = searchParams.get("year") ?? "";
  const activeCategory = searchParams.get("category") ?? "";
  const activeTag = searchParams.get("tag") ?? "";

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/blog?${params.toString()}`);
  }

  function clearFilters() {
    router.push("/blog");
  }

  const hasFilters =
    activeDestination || activeYear || activeCategory || activeTag;

  const destinationOptions = dedupeOptions(
    destinations.map((d) => ({ label: d, value: d })),
  );
  const yearOptions = dedupeOptions(
    years.map((y) => ({ label: String(y), value: String(y) })),
  );
  const categoryOptions = dedupeOptions(
    categories.map((c) => ({ label: c, value: c })),
  );
  const tagList = [...new Set(tags.filter(Boolean))].slice(0, 12);

  return (
    <aside className="space-y-6 rounded-2xl border border-border bg-card p-5 lg:sticky lg:top-24">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-sage">
          Filter posts
        </h2>
        {hasFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-xs font-semibold text-accent hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      <FilterSelect
        id="destination"
        label="Destination"
        value={activeDestination}
        onChange={(value) => updateParam("destination", value)}
        options={destinationOptions}
        emptyLabel="All destinations"
      />

      <FilterSelect
        id="year"
        label="Year"
        value={activeYear}
        onChange={(value) => updateParam("year", value)}
        options={yearOptions}
        emptyLabel="All years"
      />

      <FilterSelect
        id="category"
        label="Category"
        value={activeCategory}
        onChange={(value) => updateParam("category", value)}
        options={categoryOptions}
        emptyLabel="All categories"
      />

      {tagList.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">
            Popular tags
          </p>
          <div className="flex flex-wrap gap-2">
            {tagList.map((tag) => (
              <Link
                key={tag}
                href={`/blog?tag=${encodeURIComponent(tag)}`}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition",
                  activeTag === tag
                    ? "bg-sage text-white"
                    : "bg-cream text-sage hover:bg-sage-light",
                )}
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  emptyLabel,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { label: string; value: string }[];
  emptyLabel: string;
}) {
  const selectId = `filter-${id}`;

  return (
    <div>
      <label
        htmlFor={selectId}
        className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted"
      >
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/20"
      >
        <option value="">{emptyLabel}</option>
        {options.map((option) => (
          <option key={`${id}-${option.value}`} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

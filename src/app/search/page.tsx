import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { SearchBar } from "@/components/ui/SearchBar";
import { Container } from "@/components/ui/Container";
import { searchPosts } from "@/lib/posts";
import { formatDate, getPostDisplayDate } from "@/lib/utils";

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export const metadata = {
  title: "Search",
  description: "Search all travel stories by keyword, destination, or topic.",
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? "";
  const results = query ? searchPosts(query) : [];

  return (
    <Container className="py-12 lg:py-16">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-sage sm:text-5xl">
          Search
        </h1>
        <p className="mt-3 text-lg text-muted">
          Find stories by destination, activity, or keyword.
        </p>
      </header>

      <div className="mt-8 max-w-xl">
        <Suspense fallback={null}>
          <SearchBar defaultValue={query} />
        </Suspense>
      </div>

      {query && (
        <section className="mt-10">
          <p className="mb-6 text-sm text-muted">
            {results.length} result{results.length === 1 ? "" : "s"} for &ldquo;
            {query}&rdquo;
          </p>

          {results.length > 0 ? (
            <ul className="space-y-4">
              {results.map((result) => {
                const displayDate = getPostDisplayDate(result);
                return (
                <li key={result.slug}>
                  <Link
                    href={`/blog/${result.slug}`}
                    className="flex gap-4 rounded-2xl border border-border bg-card p-4 transition hover:shadow-md sm:gap-6 sm:p-5"
                  >
                    <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-40">
                      <Image
                        src={result.featuredImage}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="160px"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-accent">
                        {result.destination} · {result.year}
                      </p>
                      <h2 className="mt-1 font-display text-xl font-semibold text-sage">
                        {result.title}
                      </h2>
                      <p className="mt-1 line-clamp-2 text-sm text-muted">
                        {result.excerpt}
                      </p>
                      <time
                        dateTime={displayDate}
                        className="mt-2 block text-xs text-muted"
                      >
                        {formatDate(displayDate)}
                      </time>
                    </div>
                  </Link>
                </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-border bg-cream/50 p-10 text-center">
              <p className="font-display text-xl text-sage">No results found</p>
              <p className="mt-2 text-muted">
                Try different keywords like a city name, activity, or year.
              </p>
            </div>
          )}
        </section>
      )}
    </Container>
  );
}

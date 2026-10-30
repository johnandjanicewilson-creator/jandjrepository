"use client";

import { useState } from "react";
import Link from "next/link";
import type { Post } from "@/lib/types";

export default function EditExistingPostPage({
  posts,
}: {
  posts: Pick<Post, "slug" | "title" | "date" | "destination">[];
}) {
  const [search, setSearch] = useState("");

  const filteredPosts = posts.filter((post) => {
    const searchable = [
      post.title,
      post.destination,
      String(post.date),
    ]
      .join(" ")
      .toLowerCase();

    return searchable.includes(search.toLowerCase().trim());
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-12">
      <Link href="/dashboard" className="text-blue-700 underline">
        Back to Dashboard
      </Link>

      <h1 className="mt-6 text-3xl font-bold">Edit Existing Post</h1>

      <p className="mt-3">
        Find a travel story by title, destination, or year.
        Your original stories and photographs remain unchanged.
      </p>

      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Search stories..."
        aria-label="Search travel stories"
        className="mt-6 w-full rounded-lg border p-3"
      />

      <p className="mt-4 font-semibold">
        Showing {filteredPosts.length} of {posts.length} travel stories
      </p>

      <div className="mt-6 space-y-3">
        {filteredPosts.map((post) => (
          <div key={post.slug} className="rounded-lg border p-4">
            <h2 className="font-semibold">{post.title}</h2>
            <p className="text-sm text-gray-600">
              {String(post.date)} — {post.destination}
            </p>
            <Link
              href={`/dashboard/edit/${encodeURIComponent(post.slug)}`}
              className="mt-2 inline-block text-blue-700 underline"
            >
              Open Story
            </Link>
          </div>
        ))}
      </div>
    </main>
  );
}

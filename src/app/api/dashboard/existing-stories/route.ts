import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
import { getPostBySlug } from "@/lib/posts";
import { markdownToHtml } from "@/lib/markdown";
import { prepareExistingStory } from "@/lib/dashboard/prepareExistingStory";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const author = session?.user?.id;

  if (author !== "john" && author !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const { slug } = await request.json();

    if (typeof slug !== "string" || !/^[a-zA-Z0-9-]+$/.test(slug)) {
      return NextResponse.json({ error: "Invalid story" }, { status: 400 });
    }

    const post = getPostBySlug(slug);
    if (!post) {
      return NextResponse.json({ error: "Story not found" }, { status: 404 });
    }

    const sql = getDatabase();

    const existing = await sql`
      SELECT id FROM travel_drafts WHERE source_slug = ${slug}
    `;

    if (existing.length) {
      return NextResponse.json({ id: existing[0].id });
    }

    const originalMetadata = JSON.stringify({
      slug: post.slug,
      title: post.title,
      date: post.date,
      dateline: post.dateline,
      series: post.series,
      excerpt: post.excerpt,
      destination: post.destination,
      region: post.region,
      year: post.year,
      categories: post.categories,
      tags: post.tags,
      featuredImage: post.featuredImage,
      featuredImageAlt: post.featuredImageAlt,
      gallery: post.gallery,
      places: post.places,
    });

    const html = prepareExistingStory(await markdownToHtml(post.content));

    const rows = await sql`
      INSERT INTO travel_drafts (
        author, title, content, travel_date, destination, source_slug, original_metadata
      )
      VALUES (
        ${author},
        ${post.title},
        ${html},
        ${String(post.date).slice(0, 10)},
        ${post.destination || ""},
        ${slug},
        ${originalMetadata}::jsonb
      )
      ON CONFLICT (source_slug) WHERE source_slug IS NOT NULL
      DO NOTHING
      RETURNING id
    `;

    if (rows.length) {
      return NextResponse.json({ id: rows[0].id });
    }

    const saved = await sql`
      SELECT id FROM travel_drafts WHERE source_slug = ${slug}
    `;

    return NextResponse.json({ id: saved[0].id });
  } catch {
    return NextResponse.json(
      { error: "Unable to prepare story for editing" },
      { status: 500 }
    );
  }
}

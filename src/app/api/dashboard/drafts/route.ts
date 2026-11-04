import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();

  if (session?.user?.id !== "john" && session?.user?.id !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { title, story, date, destination, excerpt, featuredImage, featuredImageAlt, lockSession } = data;

    if (
      typeof title !== "string" ||
      typeof story !== "string" ||
      typeof date !== "string" ||
      typeof destination !== "string" ||
      typeof excerpt !== "string" ||
      excerpt.length > 1000 ||
      typeof featuredImage !== "string" ||
      typeof featuredImageAlt !== "string" ||
      featuredImage.length > 2000 ||
      featuredImageAlt.length > 500 ||
      (featuredImage !== "" &&
        !/^https:\/\/.+\.cloudinary\.com\//.test(featuredImage)) ||
      typeof lockSession !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lockSession)
    ) {
      return NextResponse.json({ error: "Invalid story information" }, { status: 400 });
    }

    if (title.length > 300 || story.length > 500000 ||
        destination.length > 300 ||
        (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))) {
      return NextResponse.json({ error: "Story information is too long or invalid" }, { status: 400 });
    }

    if (!title.trim() && !story.trim()) {
      return NextResponse.json(
        { error: "Please enter a title or some story text first" },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const rows = await sql`
      INSERT INTO travel_drafts (
        author, title, content, travel_date, destination,
        original_metadata,
        locked_by, lock_expires_at, lock_session
      )
      VALUES (
        ${session.user.id},
        ${title},
        ${story},
        ${date || null},
        ${destination},
        jsonb_build_object(
          'excerpt', ${excerpt}::text,
          'featuredImage', ${featuredImage}::text,
          'featuredImageAlt', ${featuredImageAlt}::text,
          '_createdInEditSession', ${lockSession}::text
        ),
        ${session.user.id},
        NOW() + INTERVAL '5 minutes',
        ${lockSession}
      )
      RETURNING id, revision
    `;

    return NextResponse.json({ id: rows[0].id, revision: rows[0].revision });
  } catch {
    return NextResponse.json({ error: "Unable to save draft" }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();

  if (session?.user?.id !== "john" && session?.user?.id !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  try {
    const sql = getDatabase();

    const rows = await sql`
      SELECT d.id, d.title, d.content AS story, d.destination,
             d.travel_date AS date, d.updated_at,
             EXISTS (
               SELECT 1 FROM travel_published p
               WHERE p.source_draft_id = d.id
             ) AS published
      FROM travel_drafts d
      WHERE NOT EXISTS (
        SELECT 1 FROM travel_published p
        WHERE p.source_draft_id = d.id
          AND p.publication_approved = true
          AND p.title IS NOT DISTINCT FROM d.title
          AND p.content IS NOT DISTINCT FROM d.content
          AND (p.original_metadata->>'excerpt') IS NOT DISTINCT FROM (d.original_metadata->>'excerpt')
          AND (p.original_metadata->>'featuredImage') IS NOT DISTINCT FROM (d.original_metadata->>'featuredImage')
          AND (p.original_metadata->>'featuredImageAlt') IS NOT DISTINCT FROM (d.original_metadata->>'featuredImageAlt')
          AND (
            d.source_slug IS NOT NULL OR
            (p.original_metadata->>'destination') IS NOT DISTINCT FROM d.destination
          )
          AND (
            d.source_slug IS NOT NULL OR
            (p.original_metadata->>'date') IS NOT DISTINCT FROM d.travel_date::text
          )
      )
      ORDER BY d.updated_at DESC
    `;

    return NextResponse.json(
      { drafts: rows },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load drafts" },
      { status: 500 }
    );
  }
}

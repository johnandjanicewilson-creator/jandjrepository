import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
import { getPostBySlug } from "@/lib/posts";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const session = await auth();
  const author = session?.user?.id;

  if (author !== "john" && author !== "janice") {
    return NextResponse.json(
      { error: "Not authorized" },
      { status: 401 }
    );
  }

  try {
    const { draftId, revision, lockSession } = await request.json();

    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (
      typeof draftId !== "string" ||
      !uuidPattern.test(draftId) ||
      !Number.isSafeInteger(revision) ||
      revision < 0 ||
      (lockSession !== null &&
        (typeof lockSession !== "string" ||
         !uuidPattern.test(lockSession)))
    ) {
      return NextResponse.json(
        { error: "Invalid publishing request" },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const drafts = await sql`
      SELECT source_slug
      FROM travel_drafts
      WHERE id = ${draftId}
    `;

    if (drafts.length > 0 && drafts[0].source_slug) {
      const originalPost = getPostBySlug(drafts[0].source_slug);

      if (!originalPost || originalPost.draft) {
        return NextResponse.json(
          { error: "This original story is unpublished and cannot be published yet" },
          { status: 403 }
        );
      }
    }

    const rows = await sql`
      INSERT INTO travel_published (
        slug, title, content, original_metadata,
        source_draft_id, published_at, publication_approved
      )
      SELECT
        source_slug, title, content, original_metadata,
        id, NOW(), true
      FROM travel_drafts
      WHERE id = ${draftId}
        AND locked_by = ${author}
        AND lock_session = ${lockSession}
        AND lock_expires_at > NOW()
        AND revision = ${revision}
        AND source_slug IS NOT NULL
        AND LENGTH(TRIM(title)) > 0
        AND LENGTH(TRIM(content)) > 0
      ON CONFLICT (slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        original_metadata = EXCLUDED.original_metadata,
        source_draft_id = EXCLUDED.source_draft_id,
        published_at = NOW(),
        publication_approved = true
      RETURNING slug
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Story is not ready to publish, or editing permission expired" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      published: true,
      slug: rows[0].slug,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to publish story" },
      { status: 500 }
    );
  }
}

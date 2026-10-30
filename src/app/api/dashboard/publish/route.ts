import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
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
      typeof lockSession !== "string" ||
      !uuidPattern.test(lockSession)
    ) {
      return NextResponse.json(
        { error: "Invalid publishing request" },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const rows = await sql`
      SELECT id, source_slug, title, content,
             original_metadata, revision
      FROM travel_drafts
      WHERE id = ${draftId}
        AND locked_by = ${author}
        AND lock_session = ${lockSession}
        AND lock_expires_at > NOW()
        AND revision = ${revision}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Story changed or editing permission expired" },
        { status: 409 }
      );
    }

    const draft = rows[0];

    if (!draft.source_slug) {
      return NextResponse.json(
        { error: "Publishing new stories is not enabled yet" },
        { status: 400 }
      );
    }

    if (!draft.title?.trim() || !draft.content?.trim()) {
      return NextResponse.json(
        { error: "Story must have a title and content" },
        { status: 400 }
      );
    }

    await sql`
      INSERT INTO travel_published (
        slug, title, content, original_metadata,
        source_draft_id, published_at
      )
      VALUES (
        ${draft.source_slug},
        ${draft.title},
        ${draft.content},
        ${JSON.stringify(draft.original_metadata)}::jsonb,
        ${draft.id},
        NOW()
      )
      ON CONFLICT (slug)
      DO UPDATE SET
        title = EXCLUDED.title,
        content = EXCLUDED.content,
        original_metadata = EXCLUDED.original_metadata,
        source_draft_id = EXCLUDED.source_draft_id,
        published_at = NOW()
    `;

    return NextResponse.json({
      published: true,
      slug: draft.source_slug,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to publish story" },
      { status: 500 }
    );
  }
}

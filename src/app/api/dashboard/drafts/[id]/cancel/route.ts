import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
import { NextResponse } from "next/server";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user?.id;

  if (user !== "john" && user !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const data = await request.json();
    const { lockSession, revision } = data;

    if (
      typeof lockSession !== "string" ||
      !uuidPattern.test(lockSession) ||
      !Number.isSafeInteger(revision) ||
      revision < 0
    ) {
      return NextResponse.json({ error: "Invalid cancellation request" }, { status: 400 });
    }

    const sql = getDatabase();

    const newlyCreated = await sql`
      DELETE FROM travel_drafts
      WHERE id = ${id}
        AND locked_by = ${user}
        AND lock_session = ${lockSession}
        AND lock_expires_at > NOW()
        AND revision = ${revision}
        AND original_metadata->>'_createdInEditSession' = ${lockSession}
        AND source_slug IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM travel_published
          WHERE source_draft_id = ${id}
        )
      RETURNING id
    `;

    if (newlyCreated.length > 0) {
      return NextResponse.json({ cancelled: true, discardedNewDraft: true });
    }

    const rows = await sql`
      UPDATE travel_drafts
      SET title = original_metadata->'_editSnapshot'->>'title',
          content = original_metadata->'_editSnapshot'->>'story',
          travel_date = NULLIF(original_metadata->'_editSnapshot'->>'date', '')::date,
          destination = original_metadata->'_editSnapshot'->>'destination',
          original_metadata = jsonb_set(
            jsonb_set(
              jsonb_set(
                jsonb_set(
                  original_metadata - '_editSnapshot' - '_writingAutosave',
                  '{series}',
                  to_jsonb(COALESCE(original_metadata->'_editSnapshot'->>'series', '')::text)
                ),
                '{excerpt}',
                to_jsonb(COALESCE(original_metadata->'_editSnapshot'->>'excerpt', '')::text)
              ),
              '{featuredImage}',
              to_jsonb(COALESCE(original_metadata->'_editSnapshot'->>'featuredImage', '')::text)
            ),
            '{featuredImageAlt}',
            to_jsonb(COALESCE(original_metadata->'_editSnapshot'->>'featuredImageAlt', '')::text)
          ),
          updated_at = NOW(),
          revision = revision + 1,
          locked_by = NULL,
          lock_session = NULL,
          lock_expires_at = NULL
      WHERE id = ${id}
        AND locked_by = ${user}
        AND lock_session = ${lockSession}
        AND lock_expires_at > NOW()
        AND revision = ${revision}
        AND original_metadata->'_editSnapshot'->>'session' = ${lockSession}
        AND jsonb_typeof(original_metadata->'_editSnapshot') = 'object'
        AND original_metadata->'_editSnapshot' ? 'title'
        AND original_metadata->'_editSnapshot' ? 'story'
        AND original_metadata->'_editSnapshot' ? 'destination'
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Cancellation could not be completed safely. Your story was not changed." },
        { status: 409 }
      );
    }

    return NextResponse.json({ cancelled: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to cancel editing" },
      { status: 500 }
    );
  }
}

import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
import { NextResponse } from "next/server";

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

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const data = await request.json();
    const lockSession = data?.lockSession;

    if (
      typeof lockSession !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lockSession)
    ) {
      return NextResponse.json(
        { error: "Invalid editing session" },
        { status: 400 }
      );
    }

    const sql = getDatabase();

    const rows = await sql`
      UPDATE travel_drafts
      SET original_metadata = CASE
            WHEN lock_session IS DISTINCT FROM ${lockSession}
            THEN jsonb_set(
              COALESCE(original_metadata, '{}'::jsonb),
              '{_editSnapshot}',
              jsonb_build_object(
                'session', ${lockSession}::text,
                'title', title,
                'story', content,
                'date', CASE WHEN travel_date IS NULL THEN '' ELSE travel_date::text END,
                'destination', destination,
                'excerpt', COALESCE(original_metadata->>'excerpt', ''),
                'featuredImage', COALESCE(original_metadata->>'featuredImage', ''),
                'featuredImageAlt', COALESCE(original_metadata->>'featuredImageAlt', '')
              )
            )
            ELSE original_metadata
          END,
          locked_by = ${user},
          lock_session = ${lockSession},
          lock_expires_at = NOW() + INTERVAL '5 minutes'
      WHERE id = ${id}
        AND (
          locked_by IS NULL
          OR lock_expires_at IS NULL
          OR lock_expires_at <= NOW()
          OR (locked_by = ${user} AND lock_session = ${lockSession})
        )
      RETURNING id, locked_by, lock_expires_at, revision
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "This story is being edited by someone else, or was not found." },
        { status: 409 }
      );
    }

    return NextResponse.json({ lock: rows[0] });
  } catch {
    return NextResponse.json({ error: "Unable to lock story" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user?.id;

  if (user !== "john" && user !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const data = await request.json();
    const lockSession = data?.lockSession;

    if (typeof lockSession !== "string" || !uuidPattern.test(lockSession)) {
      return NextResponse.json({ error: "Invalid editing session" }, { status: 400 });
    }

    const sql = getDatabase();

    const rows = await sql`
      UPDATE travel_drafts
      SET original_metadata = CASE
            WHEN original_metadata->'_editSnapshot'->>'session' = ${lockSession}
            THEN original_metadata - '_editSnapshot' - '_createdInEditSession'
            ELSE original_metadata - '_createdInEditSession'
          END,
          locked_by = NULL,
          lock_session = NULL,
          lock_expires_at = NULL
      WHERE id = ${id}
        AND locked_by = ${user}
        AND lock_session = ${lockSession}
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Editing lock was not held by this session." },
        { status: 409 }
      );
    }

    return NextResponse.json({ released: true });
  } catch {
    return NextResponse.json({ error: "Unable to release editing lock" }, { status: 500 });
  }
}

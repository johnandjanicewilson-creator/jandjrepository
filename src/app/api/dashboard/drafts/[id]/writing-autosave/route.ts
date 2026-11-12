import { auth } from "@/auth";
import { getDatabase } from "@/lib/db/neon";
import { NextResponse } from "next/server";

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const author = session?.user?.id;

  if (author !== "john" && author !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const {
      title, story, date, destination, series, excerpt,
      featuredImage, featuredImageAlt, revision, lockSession
    } = await request.json();

    if (
      typeof title !== "string" || title.length > 300 ||
      typeof story !== "string" || story.length > 500000 ||
      typeof date !== "string" ||
      (date !== "" && !/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) ||
      typeof destination !== "string" || destination.length > 300 ||
      typeof series !== "string" || series.length > 300 ||
      typeof excerpt !== "string" || excerpt.length > 1000 ||
      typeof featuredImage !== "string" || featuredImage.length > 2000 ||
      typeof featuredImageAlt !== "string" || featuredImageAlt.length > 500 ||
      !Number.isSafeInteger(revision) ||
      revision < 0 ||
      typeof lockSession !== "string" ||
      !uuid.test(lockSession)
    ) {
      return NextResponse.json({ error: "Invalid autosave information" }, { status: 400 });
    }

    const sql = getDatabase();

    const rows = await sql`
      UPDATE travel_drafts
      SET original_metadata = jsonb_set(
            COALESCE(original_metadata, '{}'::jsonb),
            '{_writingAutosave}',
            jsonb_build_object(
              'title', ${title}::text,
              'story', ${story}::text,
              'date', ${date}::text,
              'destination', ${destination}::text,
              'series', ${series}::text,
              'excerpt', ${excerpt}::text,
              'featuredImage', ${featuredImage}::text,
              'featuredImageAlt', ${featuredImageAlt}::text,
              'backedUpAt', NOW()
            )
          ),
          lock_expires_at = NOW() + INTERVAL '5 minutes'
      WHERE id = ${id}
        AND locked_by = ${author}
        AND lock_session = ${lockSession}
        AND lock_expires_at > NOW()
        AND revision = ${revision}
      RETURNING id, revision
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Editing conflict or expired lock" },
        { status: 409 }
      );
    }

    return NextResponse.json({ id: rows[0].id, revision: rows[0].revision });
  } catch {
    return NextResponse.json({ error: "Unable to autosave writing" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const author = session?.user?.id;

  if (author !== "john" && author !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuid.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const { revision, lockSession } = await request.json();

    if (
      !Number.isSafeInteger(revision) ||
      revision < 0 ||
      typeof lockSession !== "string" ||
      !uuid.test(lockSession)
    ) {
      return NextResponse.json({ error: "Invalid recovery information" }, { status: 400 });
    }

    const sql = getDatabase();

    const rows = await sql`
      UPDATE travel_drafts
      SET original_metadata =
            COALESCE(original_metadata, '{}'::jsonb) - '_writingAutosave'
      WHERE id = ${id}
        AND locked_by = ${author}
        AND lock_session = ${lockSession}
        AND lock_expires_at > NOW()
        AND revision = ${revision}
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Editing conflict or expired lock" },
        { status: 409 }
      );
    }

    return NextResponse.json({ id: rows[0].id });
  } catch {
    return NextResponse.json({ error: "Unable to discard recovery data" }, { status: 500 });
  }
}

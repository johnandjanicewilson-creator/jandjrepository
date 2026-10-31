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

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const data = await request.json();
    const { title, story, date, destination, revision, lockSession } = data;

    if (
      typeof title !== "string" ||
      typeof story !== "string" ||
      typeof date !== "string" ||
      typeof destination !== "string" ||
      !Number.isSafeInteger(revision) ||
      revision < 0 ||
      typeof lockSession !== "string" ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(lockSession) ||
      title.length > 300 ||
      story.length > 500000 ||
      destination.length > 300 ||
      (date && !/^\d{4}-\d{2}-\d{2}$/.test(date))
    ) {
      return NextResponse.json({ error: "Invalid story information" }, { status: 400 });
    }

    const sql = getDatabase();

    const rows = await sql`
      UPDATE travel_drafts
      SET title = ${title},
          content = ${story},
          travel_date = ${date || null},
          destination = ${destination},
          updated_at = NOW(),
          revision = revision + 1,
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
    return NextResponse.json({ error: "Unable to update draft" }, { status: 500 });
  }
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const author = session?.user?.id;

  if (author !== "john" && author !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const sql = getDatabase();

    const rows = await sql`
      SELECT id, title, content AS story, destination,
             travel_date AS date, updated_at, revision
      FROM travel_drafts
      WHERE id = ${id}
      LIMIT 1
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json(
      { draft: rows[0] },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to open draft" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const author = session?.user?.id;

  if (author !== "john" && author !== "janice") {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await context.params;

  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid draft ID" }, { status: 400 });
  }

  try {
    const sql = getDatabase();

    const rows = await sql`
      DELETE FROM travel_drafts
      WHERE id = ${id}
        AND source_slug IS NULL
        AND (
          lock_expires_at IS NULL
          OR lock_expires_at <= NOW()
        )
        AND NOT EXISTS (
          SELECT 1 FROM travel_published
          WHERE source_draft_id = ${id}
        )
      RETURNING id
    `;

    if (rows.length === 0) {
      return NextResponse.json({ error: "Draft not found" }, { status: 404 });
    }

    return NextResponse.json({ deleted: true });
  } catch {
    return NextResponse.json(
      { error: "Unable to delete draft" },
      { status: 500 }
    );
  }
}

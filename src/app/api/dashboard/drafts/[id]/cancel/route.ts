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

    const rows = await sql`
      UPDATE travel_drafts
      SET original_metadata =
            COALESCE(original_metadata, '{}'::jsonb)
            - '_editSnapshot'
            - '_writingAutosave'
            - '_createdInEditSession',
          locked_by = NULL,
          lock_session = NULL,
          lock_expires_at = NULL
      WHERE id = ${id}
        AND locked_by = ${user}
        AND lock_session = ${lockSession}
        AND revision = ${revision}
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

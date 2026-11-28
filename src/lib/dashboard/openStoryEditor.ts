export async function openStoryEditor(id: string) {
  const key = `jj-edit-session-${id}`;
  const stored = sessionStorage.getItem(key);
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  const lockSession =
    stored && uuidPattern.test(stored)
      ? stored
      : crypto.randomUUID();

  sessionStorage.setItem(key, lockSession);

  const response = await fetch(
    `/api/dashboard/drafts/${encodeURIComponent(id)}/lock`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lockSession }),
    }
  );

  if (response.status === 409) {
    throw new Error(
      "This story is currently unavailable for editing. Another editing session may have it open. Please try again later."
    );
  }

  if (!response.ok) {
    throw new Error("Could not open the story. Please try again.");
  }

  window.location.assign(
    `/dashboard/new?cloud=${encodeURIComponent(id)}`
  );
}

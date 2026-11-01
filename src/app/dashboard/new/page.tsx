"use client";

import { useEffect, useRef, useState } from "react";
import { getDraft, saveDraft } from "@/lib/dashboard/drafts";
import StoryEditor from "@/components/editor/StoryEditor";

export default function NewPostPage() {
  const [title, setTitle] = useState("");
  const [story, setStory] = useState("");
  const [date, setDate] = useState("");
  const [destination, setDestination] = useState("");
  const [featuredImage, setFeaturedImage] = useState("");
  const [featuredImageAlt, setFeaturedImageAlt] = useState("");
  const [featuredPhotoUploading, setFeaturedPhotoUploading] = useState(false);
  const [excerpt, setExcerpt] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [cloudDraftId, setCloudDraftId] = useState<string | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [editLockHeld, setEditLockHeld] = useState(false);
  const lockSessionRef = useRef<string | null>(null);
  const savingRef = useRef(false);
  const lockRenewalRef = useRef(false);
  const finishingRef = useRef(false);
  const [changesMade, setChangesMade] = useState(false);
  const editVersionRef = useRef(0);
  const [recoveryAvailable, setRecoveryAvailable] = useState(false);
  const [recoveryDraft, setRecoveryDraft] = useState<{
    title: string;
    story: string;
    date: string;
    destination: string;
    excerpt?: string;
    featuredImage?: string;
    featuredImageAlt?: string;
    backedUpAt: string;
  } | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  async function handlePublishStory() {
    if (
      !loaded ||
      !cloudDraftId ||
      !editLockHeld ||
      revision === null ||
      !lockSessionRef.current ||
      changesMade ||
      recoveryAvailable ||
      savingRef.current ||
      lockRenewalRef.current
    ) {
      setMessage("Save your changes successfully before publishing.");
      return;
    }

    if (!window.confirm(
      "Publish this saved story to the public website? Visitors will see this version once the website is connected."
    )) return;

    setMessage("Publishing story...");

    try {
      const response = await fetch("/api/dashboard/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId: cloudDraftId,
          revision,
          lockSession: lockSessionRef.current
        })
      });

      const result = await response.json();

      if (!response.ok) {
        setMessage(result.error || "Publishing failed.");
        return;
      }

      setMessage("Published version saved in Neon. Public website connection is still being completed.");
    } catch {
      setMessage("Could not contact the publishing service.");
    }
  }

  async function handleFinishEditing() {
    if (finishingRef.current) return;

    if (!loaded || !cloudDraftId || !editLockHeld || !lockSessionRef.current) {
      setMessage("There is no active editing session to finish.");
      return;
    }

    if (featuredPhotoUploading) {
      setMessage("Please wait for the featured photograph to finish uploading.");
      return;
    }

    if (savingRef.current || changesMade || recoveryAvailable) {
      setMessage("Please save your changes successfully before finishing editing.");
      return;
    }

    if (lockRenewalRef.current) {
      setMessage("The editing lock is being renewed. Please try Finish Editing again in a moment.");
      return;
    }

    finishingRef.current = true;

    try {
      const response = await fetch(
        `/api/dashboard/drafts/${encodeURIComponent(cloudDraftId)}/lock`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockSession: lockSessionRef.current }),
        }
      );

      if (!response.ok) {
        setMessage("Could not release the editing lock. Please try again.");
        return;
      }

      setEditLockHeld(false);
      setMessage("Editing finished. This story is now available for someone else to edit.");
    } catch {
      setMessage("Could not contact the server to finish editing. Please try again.");
    } finally {
      finishingRef.current = false;
    }
  }

  async function handleSaveDraft() {
    if (featuredPhotoUploading) {
      setMessage("Please wait for the featured photograph to finish uploading.");
      return;
    }

    if (!loaded) {
      setMessage("Please wait until the story has loaded before saving.");
      return;
    }

    if (!title.trim() && !story.trim()) {
      setMessage("Please enter a title or some story text first.");
      return;
    }

    if (recoveryAvailable) {
      setMessage("Please choose which version to keep before saving.");
      return;
    }

    if (cloudDraftId && (!editLockHeld || revision === null)) {
      setMessage("Cannot save: editing permission is missing or has expired. Keep this page open to protect your writing.");
      return;
    }

    if (savingRef.current) return;
    savingRef.current = true;

    const versionBeingSaved = editVersionRef.current;
    setMessage("Saving to Neon...");

    try {
      const url = cloudDraftId
        ? `/api/dashboard/drafts/${cloudDraftId}`
        : "/api/dashboard/drafts";

      const response = await fetch(url, {
        method: cloudDraftId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, story, date, destination, excerpt, featuredImage, featuredImageAlt, revision, lockSession: lockSessionRef.current, backedUpAt: new Date().toISOString() }),
      });

      if (!response.ok) {
        if (response.status === 409 || response.status === 404) {
          setEditLockHeld(false);
          throw new Error("EDIT_CONFLICT");
        }
        throw new Error("Database save failed");
      }

      const result = await response.json();
      setCloudDraftId(result.id);
      if (!cloudDraftId) {
        setEditLockHeld(true);
      }
      if (Number.isSafeInteger(result.revision)) {
        setRevision(result.revision);
      }
      if (editVersionRef.current === versionBeingSaved) {
        try {
          localStorage.removeItem(
            `jj-travel-backup-${cloudDraftId || "new"}`
          );
          localStorage.removeItem(
            `jj-travel-backup-${result.id}`
          );
        } catch {
          // Browser storage may be unavailable.
        }
        setChangesMade(false);
        setMessage(`Saved to Neon at ${new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`);
      } else {
        setChangesMade(true);
        setMessage("Newer changes are waiting to be saved.");
      }
    } catch (error) {
      setChangesMade(true);
      if (error instanceof Error && error.message === "EDIT_CONFLICT") {
        setMessage("Save blocked: this story may have changed or its editing lock expired. Your writing remains on this page. Do not close it.");
      } else {
        setRetryCount((count) => count + 1);
        setMessage("Not saved to Neon — connection problem. Keep this page open. We will try again automatically.");
      }
    } finally {
      savingRef.current = false;
    }
  }

  useEffect(() => {
    if (!cloudDraftId || !editLockHeld) return;

    const timer = window.setInterval(async () => {
      if (lockRenewalRef.current || finishingRef.current) return;
      lockRenewalRef.current = true;

      try {
        const response = await fetch(
          `/api/dashboard/drafts/${encodeURIComponent(cloudDraftId)}/lock`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lockSession: lockSessionRef.current }),
          }
        );
        if (!response.ok) {
          setEditLockHeld(false);
          setMessage("Editing lock lost. Please do not close this page.");
        }
      } catch {
        setEditLockHeld(false);
        setMessage("Could not renew editing lock. Please do not close this page.");
      } finally {
        lockRenewalRef.current = false;
      }
    }, 120000);

    return () => window.clearInterval(timer);
  }, [cloudDraftId, editLockHeld]);

  useEffect(() => {
    if (!lockSessionRef.current) {
      lockSessionRef.current = crypto.randomUUID();
    }

    try {
      const params = new URLSearchParams(window.location.search);
      const cloudId = params.get("cloud");

      if (cloudId) {
        fetch(`/api/dashboard/drafts/${encodeURIComponent(cloudId)}/lock`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lockSession: lockSessionRef.current }),
        })
          .then(async (response) => {
            if (!response.ok) {
              if (response.status !== 409) {
                throw new Error("Unable to request editing permission.");
              }
              setEditLockHeld(false);
              setMessage("Read-only: this story is being edited in another session.");
            } else {
              setEditLockHeld(true);
            }
            return fetch(`/api/dashboard/drafts/${encodeURIComponent(cloudId)}`, {
              cache: "no-store",
            });
          })
          .then(async (response) => {
            if (!response.ok) throw new Error("Unable to open cloud draft");
            return response.json();
          })
          .then(({ draft }) => {
            setCloudDraftId(draft.id);
            setRevision(draft.revision);
            setTitle(draft.title ?? "");
            setStory(draft.story ?? "");
            setDestination(draft.destination ?? "");
            setDate(draft.date ? String(draft.date).slice(0, 10) : "");
            setFeaturedImage(draft.featuredImage ?? "");
            setFeaturedImageAlt(draft.featuredImageAlt ?? "");
            setExcerpt(draft.excerpt ?? "");
            setLoaded(true);
          })
          .catch((error) => {
            setEditLockHeld(false);
            setMessage(
              error instanceof Error &&
              error.message.includes("Another person may be editing")
                ? "This story is currently being edited in another session. Please try again later."
                : "Could not open this Neon draft. Please try again."
            );
            setLoaded(false);
          });
        return;
      }

      const requestedId = params.get("draft");
      if (requestedId) {
        const existing = getDraft(requestedId);
        if (existing) {
          setDraftId(existing.id);
          setTitle(existing.title);
          setStory(existing.story);
          setDate(existing.date ?? "");
          setDestination(existing.destination ?? "");
          setLoaded(true);
          return;
        }
        setMessage("That saved draft could not be found.");
      }

      // A new post starts blank. Saved drafts open by their ID.
    } catch {
      // Ignore damaged or unavailable browser storage.
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || changesMade) return;

    try {
      const backupKey = `jj-travel-backup-${cloudDraftId || "new"}`;
      const saved = localStorage.getItem(backupKey);
      if (!saved) return;

      const backup = JSON.parse(saved);
      if (
        typeof backup.title !== "string" ||
        typeof backup.story !== "string" ||
        typeof backup.date !== "string" ||
        typeof backup.destination !== "string" ||
        typeof backup.backedUpAt !== "string"
      ) return;

      const differs =
        backup.title !== title ||
        backup.story !== story ||
        backup.date !== date ||
        backup.destination !== destination ||
        (typeof backup.excerpt === "string" &&
         backup.excerpt !== excerpt) ||
        (typeof backup.featuredImage === "string" &&
         backup.featuredImage !== featuredImage) ||
        (typeof backup.featuredImageAlt === "string" &&
         backup.featuredImageAlt !== featuredImageAlt);

      if (differs) {
        setRecoveryDraft(backup);
        setRecoveryAvailable(true);
      }
    } catch {
      // Ignore unavailable or damaged browser backups.
    }
  }, [loaded, cloudDraftId]);

  useEffect(() => {
    if (!loaded || !changesMade || recoveryAvailable) return;
    try {
      const backupKey = `jj-travel-backup-${cloudDraftId || "new"}`;
      localStorage.setItem(
        backupKey,
        JSON.stringify({
          title,
          story,
          date,
          destination,
          excerpt,
          featuredImage,
          featuredImageAlt,
          backedUpAt: new Date().toISOString()
        })
      );
    } catch {
      // Browser storage may be unavailable.
    }
  }, [title, story, date, destination, excerpt, featuredImage, featuredImageAlt, loaded, cloudDraftId]);

  useEffect(() => {
    if (!loaded || !changesMade || recoveryAvailable) return;

    const timer = setTimeout(() => {
      void handleSaveDraft();
    }, 30000);

    return () => clearTimeout(timer);
  }, [loaded, changesMade, title, story, date, destination, excerpt, featuredImage, featuredImageAlt, featuredPhotoUploading, retryCount, recoveryAvailable]);

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-3xl font-bold">
        {cloudDraftId ? "Edit Travel Story" : "Write a New Travel Story"}
      </h1>
      <p className="mt-3">
        {cloudDraftId
          ? "Edit your story and photographs, then save your changes."
          : "Write your story here, or paste it from OpenOffice."}
      </p>

      {recoveryAvailable && recoveryDraft && (
        <div
          role="alert"
          className="mt-6 rounded-lg border-2 border-amber-500 bg-amber-50 p-5 text-gray-900"
        >
          <h2 className="text-lg font-bold">Unsaved Browser Copy Found</h2>
          <p className="mt-2">
            Firefox has a different copy of this story. It may contain
            writing that was not saved to Neon.
          </p>
          <p className="mt-2 text-sm">
            We will let you choose which version to keep.
            Nothing has been restored automatically.
          </p>
          <button
            type="button"
            className="mt-4 rounded-lg bg-blue-700 px-4 py-2 font-semibold text-white"
            onClick={() => {
              if (!recoveryDraft) return;
              setTitle(recoveryDraft.title);
              setStory(recoveryDraft.story);
              setDate(recoveryDraft.date);
              setDestination(recoveryDraft.destination);
              setExcerpt(recoveryDraft.excerpt ?? "");
              setFeaturedImage(recoveryDraft.featuredImage ?? "");
              setFeaturedImageAlt(recoveryDraft.featuredImageAlt ?? "");
              editVersionRef.current += 1;
              setChangesMade(true);
              setRecoveryAvailable(false);
              setRecoveryDraft(null);
              setMessage("Browser copy recovered. Save to Neon to keep it.");
            }}
          >
            Recover Browser Copy
          </button>
          <button
            type="button"
            className="ml-3 mt-4 rounded-lg border border-gray-500 px-4 py-2 font-semibold"
            onClick={() => {
              try {
                const backupKey = `jj-travel-backup-${cloudDraftId || "new"}`;
                const oldBackup = localStorage.getItem(backupKey);
                if (oldBackup) {
                  const archiveKey = `jj-travel-archive-${crypto.randomUUID()}`;
                  localStorage.setItem(archiveKey, oldBackup);
                  localStorage.removeItem(backupKey);
                }
              } catch {
                setMessage("Could not archive the browser copy. Please try again.");
                return;
              }
              setRecoveryAvailable(false);
              setRecoveryDraft(null);
              setMessage("Keeping the Neon version. The browser copy was archived.");
            }}
          >
            Keep Neon Version
          </button>
        </div>
      )}

      <h2 className="mt-8 border-b pb-3 text-2xl font-bold">
        Story Information
      </h2>

      <div className="mt-6">
        <label htmlFor="title" className="block font-semibold">
          Story Title
        </label>
        <input
          disabled={recoveryAvailable || (cloudDraftId !== null && !editLockHeld)}
          id="title"
          className="mt-2 w-full rounded-lg border p-3"
          placeholder="Enter your story title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            editVersionRef.current += 1;
            setChangesMade(true);
          }}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="date" className="block font-semibold">
          Story Date
        </label>
        <input
          disabled={recoveryAvailable || (cloudDraftId !== null && !editLockHeld)}
          id="date"
          type="date"
          className="mt-2 rounded-lg border p-3"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            editVersionRef.current += 1;
            setChangesMade(true);
          }}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="destination" className="block font-semibold">
          Destination
        </label>
        <input
          disabled={recoveryAvailable || (cloudDraftId !== null && !editLockHeld)}
          id="destination"
          className="mt-2 w-full rounded-lg border p-3"
          placeholder="Example: Washington, D.C."
          value={destination}
          onChange={(e) => {
            setDestination(e.target.value);
            editVersionRef.current += 1;
            setChangesMade(true);
          }}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="featured-photo" className="block font-semibold">
          Featured Photograph (Optional)
        </label>
        <p className="mt-1 text-sm text-gray-600">
          Choose the main photograph for this travel story.
        </p>
        <input
          id="featured-photo"
          type="file"
          accept="image/jpeg,image/png"
          disabled={featuredPhotoUploading || recoveryAvailable || (cloudDraftId !== null && !editLockHeld)}
          className="mt-2 block w-full rounded-lg border p-3"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (!file) return;
            if (!["image/jpeg", "image/png"].includes(file.type) || file.size > 10 * 1024 * 1024) {
              setMessage("Choose a JPEG or PNG photograph smaller than 10 MB.");
              event.target.value = "";
              return;
            }
            setFeaturedPhotoUploading(true);
            setMessage("Uploading featured photograph...");
            try {
              const form = new FormData();
              form.append("file", file);
              const response = await fetch("/api/dashboard/upload", {
                method: "POST",
                body: form,
              });
              const result = await response.json();
              if (!response.ok || typeof result.url !== "string") {
                throw new Error(result.error || "Photograph upload failed.");
              }
              setFeaturedImage(result.url);
              setFeaturedImageAlt(file.name);
              editVersionRef.current += 1;
              setChangesMade(true);
              setMessage("Featured photograph uploaded. Save Draft to keep it with this story.");
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "Photograph upload failed.");
            } finally {
              setFeaturedPhotoUploading(false);
              event.target.value = "";
            }
          }}
        />
      </div>

      {featuredImage && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-semibold">Featured Photograph Preview</p>
          <img
            src={featuredImage}
            alt={featuredImageAlt || "Featured travel photograph"}
            className="max-h-72 max-w-full rounded-lg border object-contain"
          />
        </div>
      )}

      <div className="mt-6">
        <label htmlFor="excerpt" className="block font-semibold">
          Short Introduction (Optional)
        </label>
        <textarea
          id="excerpt"
          rows={3}
          maxLength={1000}
          disabled={recoveryAvailable || (cloudDraftId !== null && !editLockHeld)}
          className="mt-2 w-full rounded-lg border p-3"
          placeholder="A few sentences introducing your travel story"
          value={excerpt}
          onChange={(e) => {
            setExcerpt(e.target.value);
            editVersionRef.current += 1;
            setChangesMade(true);
          }}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="story" className="block font-semibold">
          Your Story
        </label>

        <StoryEditor
          value={story}
          disabled={recoveryAvailable || (cloudDraftId !== null && !editLockHeld)}
          onChange={(newStory) => {
            setStory(newStory);
            editVersionRef.current += 1;
            setChangesMade(true);
          }}
        />
     
 </div>
      <button
        type="button"
        onClick={handleSaveDraft}
        disabled={!loaded || recoveryAvailable || (cloudDraftId !== null && !editLockHeld)}
        className="mt-6 rounded-lg bg-green-800 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save Draft
      </button>

      {cloudDraftId && editLockHeld && (
        <button
          type="button"
          onClick={handleFinishEditing}
          disabled={!loaded || changesMade || recoveryAvailable || savingRef.current}
          className="ml-3 mt-6 rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Finish Editing
        </button>
      )}

      {cloudDraftId && editLockHeld && (
        <button
          type="button"
          onClick={handlePublishStory}
          disabled={
            true ||
            !loaded ||
            changesMade ||
            recoveryAvailable ||
            revision === null
          }
          className="ml-3 mt-6 rounded-lg bg-amber-700 px-6 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Publish Story
        </button>
      )}

      {message && <p role="status" className="mt-3">{message}</p>}

      <p className="mt-4 text-sm">
        Your changes are automatically saved to Neon while you write. Publishing is not available yet.
      </p>
    </main>
  );
}

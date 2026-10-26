export type TravelDraft = {
  id: string;
  title: string;
  story: string;
  date?: string;
  destination?: string;
  destination?: string;
  updatedAt: string;
};

const STORAGE_KEY = "jj-travel-drafts";

export function getDrafts(): TravelDraft[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const drafts = saved ? JSON.parse(saved) : [];
    return Array.isArray(drafts) ? drafts : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: TravelDraft): void {
  const drafts = getDrafts();
  const index = drafts.findIndex((item) => item.id === draft.id);

  if (index >= 0) {
    drafts[index] = draft;
  } else {
    drafts.push(draft);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function getDraft(id: string): TravelDraft | undefined {
  return getDrafts().find((draft) => draft.id === id);
}

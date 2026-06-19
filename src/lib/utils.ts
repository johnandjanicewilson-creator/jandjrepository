export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });
}

/** ISO date string for display: dateline when set, otherwise publish date. */
export function getPostDisplayDate(post: {
  date: string;
  dateline?: string;
}): string {
  const dateline = post.dateline?.trim();
  return dateline || post.date;
}

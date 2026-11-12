import { commitStagedPhoto } from "./commitStagedPhoto";

export async function prepareStoryPhotos(html: string): Promise<string> {
  if (!html.includes("jj-staged:")) {
    return html;
  }

  const document = new DOMParser().parseFromString(html, "text/html");
  const uploaded = new Map<string, string>();

  async function resolve(source: string): Promise<string> {
    if (!source.startsWith("jj-staged:")) return source;

    const existing = uploaded.get(source);
    if (existing) return existing;

    const permanent = await commitStagedPhoto(source);
    uploaded.set(source, permanent);
    return permanent;
  }

  for (const gallery of document.querySelectorAll("figure[data-photo-gallery]")) {
    const raw = gallery.getAttribute("data-photos") || "[]";
    const photos: unknown = JSON.parse(raw);

    if (!Array.isArray(photos)) {
      throw new Error("Invalid photograph gallery.");
    }

    for (const photo of photos) {
      if (
        !photo ||
        typeof photo !== "object" ||
        typeof photo.src !== "string"
      ) {
        throw new Error("Invalid photograph in gallery.");
      }

      photo.src = await resolve(photo.src);
    }

    gallery.setAttribute("data-photos", JSON.stringify(photos));
  }

  for (const image of document.querySelectorAll("img")) {
    const source = image.getAttribute("src") || "";
    image.setAttribute("src", await resolve(source));
  }

  return document.body.innerHTML;
}

export function extractPhotoState(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  const photos: unknown[] = [];

  function elementPosition(element: Element): number[] {
    const position: number[] = [];
    let current: Element | null = element;

    while (current && current !== document.body) {
      const parent: Element | null = current.parentElement;
      if (!parent) break;
      position.unshift(Array.from(parent.children).indexOf(current));
      current = parent;
    }

    return position;
  }

  document.querySelectorAll("figure[data-photo-gallery], img").forEach((element) => {
    if (element.matches("figure[data-photo-gallery]")) {
      photos.push({
        type: "gallery",
        position: elementPosition(element),
        photos: element.getAttribute("data-photos") || "[]",
        caption: element.getAttribute("data-caption") || "",
      });
    } else {
      photos.push({
        type: "image",
        elementPosition: elementPosition(element),
        src: element.getAttribute("src") || "",
        alt: element.getAttribute("alt") || "",
        caption: element.getAttribute("data-photo-caption") || "",
        position: element.getAttribute("data-photo-position") || "",
        width: element.getAttribute("data-photo-width") || "",
        size: element.getAttribute("data-photo-size") || "",
      });
    }
  });

  return JSON.stringify(photos);
}

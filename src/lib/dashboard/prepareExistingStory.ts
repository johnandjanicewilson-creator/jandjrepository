export function prepareExistingStory(html: string): string {
  return html
    .replace(
      /<figure\b[^>]*>([\s\S]*?)<\/figure>/gi,
      (_figure, contents: string) => {
        const image = contents.match(/<img\b[^>]*>/i);
        if (!image) return contents;
        return `<p>${prepareImage(image[0])}</p>`;
      }
    )
    .replace(
      /<div class="post-media">([\s\S]*?)<\/div>/gi,
      (_div, contents: string) => {
        const image = contents.match(/<img\b[^>]*>/i);
        return image ? `<p>${prepareImage(image[0])}</p>` : contents;
      }
    );
}

function prepareImage(image: string): string {
  const alt = image.match(/\balt=(["'])(.*?)\1/i)?.[2] || "";
  const caption = alt.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return image.replace(
    /<img\b/i,
    `<img data-photo-size="medium" data-photo-position="center" data-photo-caption="${caption}"`
  );
}

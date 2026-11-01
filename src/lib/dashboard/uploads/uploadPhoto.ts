export async function uploadPhoto(file: File): Promise<string> {
  if (!["image/jpeg", "image/png"].includes(file.type)) {
    throw new Error("Please select a JPEG or PNG photograph.");
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error("Photograph exceeds 10 MB.");
  }

  const authorization = await fetch("/api/dashboard/upload-signature", {
    method: "POST",
  });

  const settings = await authorization.json();

  if (!authorization.ok) {
    throw new Error(settings.error || "Upload authorization failed.");
  }

  const form = new FormData();
  form.append("file", file);
  form.append("api_key", settings.apiKey);
  form.append("timestamp", String(settings.timestamp));
  form.append("folder", settings.folder);
  form.append("public_id", settings.publicId);
  form.append("overwrite", "false");
  form.append("signature", settings.signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(settings.cloudName)}/image/upload`,
    {
      method: "POST",
      body: form,
    }
  );

  const result = await response.json();

  if (!response.ok || typeof result.secure_url !== "string") {
    throw new Error(result.error?.message || "Photograph upload failed.");
  }

  return result.secure_url;
}

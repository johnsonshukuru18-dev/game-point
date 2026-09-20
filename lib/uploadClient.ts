"use client";

/** Reads a File as a base64 data URI (e.g. "data:image/png;base64,...."). */
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

/**
 * Uploads an image file to Cloudinary via /api/upload and returns the
 * hosted HTTPS URL. Throws with a friendly message on failure.
 */
export async function uploadImageFile(file: File, folder: "avatars" | "posts"): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Image is too large (max 6MB).");
  }
  const dataUri = await fileToDataUri(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dataUri, folder }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  const data = await res.json();
  return data.url as string;
}
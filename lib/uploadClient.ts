
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
 * Uploads an image file to the server via /api/upload and returns the
 * hosted HTTPS URL. Throws with a friendly message on failure — including
 * if the request stalls (e.g. a slow connection), instead of hanging
 * forever with no feedback.
 */
export async function uploadImageFile(file: File, folder: "avatars" | "posts"): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image is too large (max 4MB). Try a smaller photo or a screenshot instead of a full-resolution camera photo.");
  }
  const dataUri = await fileToDataUri(file);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  let res: Response;
  try {
    res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUri, folder }),
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err.name === "AbortError") {
      throw new Error("Upload timed out. Check your connection and try again, or use a smaller image.");
    }
    throw new Error("Network error during upload. Please try again.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Upload failed");
  }
  const data = await res.json();
  return data.url as string;
}
import { put } from "@vercel/blob";

/**
 * Uploads a base64 data-URI image to Vercel Blob storage (the project's
 * connected Blob store) and returns the public HTTPS URL.
 */
export async function uploadImage(dataUri: string, folder: string): Promise<string> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      "Vercel Blob storage is not configured. Connect a Blob store to this project (Vercel dashboard -> Storage)."
    );
  }

  const match = dataUri.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
  if (!match) {
    throw new Error("Invalid image data.");
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const buffer = Buffer.from(base64Data, "base64");
  const ext = mimeType.split("/")[1] || "jpg";
  const filename = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${ext}`;

  const blob = await put(filename, buffer, {
    access: "public",
    contentType: mimeType,
  });

  return blob.url;
}
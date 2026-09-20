import { NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadImage } from "@/lib/cloudinary";
import { jsonError, jsonOk } from "@/lib/utils";

const MAX_BASE64_BYTES = 8 * 1024 * 1024; // ~8MB safety cap

// Accepts a JSON body: { dataUri: "data:image/png;base64,....", folder: "posts" | "avatars" }
// and uploads it to Cloudinary, returning the hosted HTTPS URL.
export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) return jsonError("Not authenticated", 401);

  const body = await req.json().catch(() => null);
  if (!body?.dataUri || typeof body.dataUri !== "string" || !body.dataUri.startsWith("data:image/")) {
    return jsonError("A valid image data URI is required", 422);
  }
  if (body.dataUri.length > MAX_BASE64_BYTES) {
    return jsonError("Image too large (max ~6MB)", 413);
  }
  const folder = body.folder === "avatars" ? "avatars" : "posts";

  try {
    const url = await uploadImage(body.dataUri, folder);
    return jsonOk({ url });
  } catch (err: any) {
    console.error("Upload failed:", err);
    return jsonError("Image upload failed. Please try again.", 500);
  }
}
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Uploads a base64 data-URI (or remote/local file path) to Cloudinary and
 * returns the secure HTTPS URL. Throws if Cloudinary env vars are missing
 * or the upload fails — callers should catch and surface a clean error.
 */
export async function uploadImage(dataUri: string, folder: string): Promise<string> {
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    throw new Error(
      "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and " +
        "CLOUDINARY_API_SECRET in .env (see .env.example)."
    );
  }
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `game-point/${folder}`,
    resource_type: "image",
    transformation: [{ width: 1600, crop: "limit" }, { quality: "auto" }],
  });
  return result.secure_url;
}

export default cloudinary;

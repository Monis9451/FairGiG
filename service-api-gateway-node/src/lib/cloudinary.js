import { v2 as cloudinary } from "cloudinary";

import { env } from "../config/env.js";
import { HttpError } from "./http.js";

const hasCloudinaryConfig = Boolean(
  env.cloudinaryCloudName && env.cloudinaryApiKey && env.cloudinaryApiSecret
);

if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret,
    secure: true,
  });
}

export const isCloudinaryConfigured = () => hasCloudinaryConfig;

export const uploadShiftScreenshotBuffer = async ({ buffer, originalFilename }) => {
  if (!hasCloudinaryConfig) {
    throw new HttpError(
      503,
      "Cloudinary is not configured on the server. Set CLOUDINARY_* env vars."
    );
  }

  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "image",
        folder: env.cloudinaryUploadFolder,
        allowed_formats: env.cloudinaryAllowedFormats,
        overwrite: false,
      },
      (error, result) => {
        if (error) {
          reject(new HttpError(502, "Cloudinary upload failed.", error.message));
          return;
        }

        if (!result?.secure_url) {
          reject(new HttpError(502, "Cloudinary upload did not return a secure URL."));
          return;
        }

        resolve({
          secure_url: result.secure_url,
          public_id: result.public_id,
          bytes: result.bytes,
          width: result.width,
          height: result.height,
          format: result.format,
          original_filename: originalFilename || null,
        });
      }
    );

    stream.end(buffer);
  });
};

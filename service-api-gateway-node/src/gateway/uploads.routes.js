import path from "path";

import express from "express";
import multer from "multer";

import { env } from "../config/env.js";
import { uploadShiftScreenshotBuffer } from "../lib/cloudinary.js";
import { HttpError, asyncHandler, success } from "../lib/http.js";
import { requireRole } from "../middleware/auth.js";

const router = express.Router();

const allowedFormats = new Set(env.cloudinaryAllowedFormats);
const maxUploadBytes = Math.round(env.cloudinaryMaxUploadMb * 1024 * 1024);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: maxUploadBytes,
  },
  fileFilter: (_req, file, callback) => {
    if (!String(file?.mimetype || "").toLowerCase().startsWith("image/")) {
      callback(new HttpError(400, "Only image files are supported for screenshot uploads."));
      return;
    }

    callback(null, true);
  },
});

const getFileFormat = (file) => {
  const extension = path.extname(file?.originalname || "").replace(".", "").toLowerCase();
  if (extension) {
    return extension;
  }

  const mime = String(file?.mimetype || "").toLowerCase();
  if (mime.includes("/")) {
    return mime.split("/")[1];
  }

  return "";
};

const uploadSingleScreenshot = (req, res) =>
  new Promise((resolve, reject) => {
    upload.single("screenshot")(req, res, (error) => {
      if (!error) {
        resolve();
        return;
      }

      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        reject(
          new HttpError(
            413,
            `Screenshot exceeds ${env.cloudinaryMaxUploadMb} MB limit.`
          )
        );
        return;
      }

      reject(error);
    });
  });

router.post(
  "/shift-screenshot",
  requireRole("worker"),
  asyncHandler(async (req, res) => {
    await uploadSingleScreenshot(req, res);

    const file = req.file;
    if (!file) {
      throw new HttpError(
        400,
        'screenshot is required as multipart/form-data field name "screenshot".'
      );
    }

    const fileFormat = getFileFormat(file);
    if (!allowedFormats.has(fileFormat)) {
      throw new HttpError(
        400,
        `Unsupported image format. Allowed formats: ${[...allowedFormats].join(", ")}.`
      );
    }

    const uploaded = await uploadShiftScreenshotBuffer({
      buffer: file.buffer,
      originalFilename: file.originalname,
    });

    return res.status(201).json(
      success({
        screenshot: uploaded,
      })
    );
  })
);

export default router;

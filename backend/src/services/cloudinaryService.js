import fs from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import cloudinary from "../config/cloudinary.js";
import ffmpegPath from "ffmpeg-static";
import ffprobeStatic from "ffprobe-static";
import { AppError } from "../utils/apiResponse.js";

const execFileAsync = promisify(execFile);

/*
 * Cloudinary account video asset limit aur safe compression target.
 */
const CLOUDINARY_VIDEO_LIMIT_BYTES = 100 * 1024 * 1024;
const COMPRESSED_VIDEO_TARGET_BYTES = 96 * 1024 * 1024;

const DEFAULT_CHUNK_SIZE_BYTES =
  6 * 1024 * 1024;

async function getVideoDuration(filePath) {
  if (!ffprobeStatic?.path) {
    throw new AppError("FFprobe binary nahi mili", 503);
  }

  const { stdout } = await execFileAsync(
    ffprobeStatic.path,
    [
      "-v", "error",
      "-show_entries", "format=duration",
      "-of", "default=noprint_wrappers=1:nokey=1",
      filePath,
    ],
    { windowsHide: true }
  );

  const duration = Number(String(stdout).trim());

  if (!Number.isFinite(duration) || duration <= 0) {
    throw new AppError("Video duration detect nahi hui", 400);
  }

  return duration;
}

/**
 * Pehle video stream copy karke sirf audio optimize karta hai. Agar output
 * phir bhi 100 MiB se bada ho to fast single-pass H.264 fallback chalata hai.
 */
async function compressVideoForCloudinary(filePath) {
  if (!ffmpegPath) {
    throw new AppError("FFmpeg binary nahi mili", 503);
  }

  const duration = await getVideoDuration(filePath);
  const outputPath = `${filePath}.cloudinary.mp4`;
  const totalBitrateKbps = Math.floor(
    (COMPRESSED_VIDEO_TARGET_BYTES * 8) / duration / 1000 * 0.97
  );
  const audioBitrateKbps =
    totalBitrateKbps >= 500
      ? 96
      : totalBitrateKbps >= 250
        ? 64
        : 32;
  const videoBitrateKbps = Math.max(
    24,
    totalBitrateKbps - audioBitrateKbps
  );

  if (totalBitrateKbps <= audioBitrateKbps + 24) {
    throw new AppError(
      "Video duration Cloudinary ki 100 MB limit ke liye supported range se bahar hai",
      400
    );
  }

  try {
    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-i", filePath,
        "-map", "0:v:0",
        "-map", "0:a:0?",
        "-c:v", "copy",
        "-c:a", "aac",
        "-ac", "1",
        "-b:a", "48k",
        "-movflags", "+faststart",
        outputPath,
      ],
      { maxBuffer: 10 * 1024 * 1024, windowsHide: true }
    );

    if (fs.statSync(outputPath).size < CLOUDINARY_VIDEO_LIMIT_BYTES) {
      return outputPath;
    }

    removeLocalFile(outputPath);

    console.log(
      "Fast audio optimization ke baad bhi video 100 MiB se badi hai; fast re-encode start ho raha hai"
    );

    await execFileAsync(
      ffmpegPath,
      [
        "-y",
        "-i", filePath,
        "-map", "0:v:0",
        "-c:v", "libx264",
        "-preset", "veryfast",
        "-b:v", `${videoBitrateKbps}k`,
        "-maxrate", `${videoBitrateKbps}k`,
        "-bufsize", `${videoBitrateKbps * 2}k`,
        "-map", "0:a:0?",
        "-c:a", "aac",
        "-ac", "1",
        "-b:a", `${audioBitrateKbps}k`,
        "-movflags", "+faststart",
        outputPath,
      ],
      { maxBuffer: 10 * 1024 * 1024, windowsHide: true }
    );

    if (fs.statSync(outputPath).size >= CLOUDINARY_VIDEO_LIMIT_BYTES) {
      throw new AppError(
        "Compressed video ab bhi Cloudinary ki 100 MB limit se badi hai",
        400
      );
    }

    return outputPath;
  } catch (error) {
    removeLocalFile(outputPath);
    throw error;
  }
}

/**
 * Check karta hai ki Cloudinary credentials available hain.
 */
function ensureCloudinaryConfigured() {
  const requiredVariables = [
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
  ];

  const missingVariables = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missingVariables.length > 0) {
    throw new AppError(
      `Missing Cloudinary variables: ${missingVariables.join(", ")}`,
      503
    );
  }
}

/**
 * Local file available hai ya nahi check karta hai.
 */
function ensureFileExists(filePath) {
  if (!filePath) {
    throw new AppError(
      "Upload ke liye file path required hai",
      400
    );
  }

  if (!fs.existsSync(filePath)) {
    throw new AppError(
      `Local file nahi mili: ${filePath}`,
      404
    );
  }
}

/**
 * Object se undefined aur null properties remove karta hai.
 */
function cleanOptions(options) {
  return Object.fromEntries(
    Object.entries(options).filter(
      ([, value]) =>
        value !== undefined &&
        value !== null &&
        value !== ""
    )
  );
}

/**
 * Local video ko Cloudinary ke chunked upload endpoint par bhejta hai.
 */
function uploadLargeVideo(filePath, options) {
  return new Promise((resolve, reject) => {
    let settled = false;

    const uploadOptions = cleanOptions({
      resource_type: "video",

      folder:
        options.folder ||
        process.env.CLOUDINARY_VIDEO_FOLDER ||
        "skillcert-ai/videos",

      public_id: options.publicId,

      chunk_size:
        options.chunkSize ||
        DEFAULT_CHUNK_SIZE_BYTES,

      overwrite:
        options.overwrite ?? false,

      use_filename:
        options.publicId ? false : true,

      unique_filename:
        options.publicId ? false : true,

      tags: options.tags,

      context: options.context,
    });

    const handleUploadResult = (error, result) => {
      if (settled) {
        return;
      }

      if (error) {
        settled = true;
        reject(error);
        return;
      }

      /*
       * Chunked upload me har chunk ke baad
       * done:false response aa sakta hai.
       */
      if (!result || result.done === false) {
        return;
      }

      settled = true;
      resolve(result);
    };

    try {
      const uploadStream =
        cloudinary.uploader.upload_large(
          filePath,
          uploadOptions,
          handleUploadResult
        );

      uploadStream?.on?.("error", (error) => {
        if (!settled) {
          settled = true;
          reject(error);
        }
      });
    } catch (error) {
      if (!settled) {
        settled = true;
        reject(error);
      }
    }
  });
}

/**
 * Video Cloudinary par upload karta hai.
 *
 * 100 MiB se badi video pehle fast compression flow se process hoti hai.
 */
export async function uploadVideoToCloudinary(
  filePath,
  options = {}
) {
  ensureCloudinaryConfigured();
  ensureFileExists(filePath);

  let uploadPath = filePath;

  try {
    const fileStats = fs.statSync(filePath);

    if (fileStats.size >= CLOUDINARY_VIDEO_LIMIT_BYTES) {
      console.log(
        `Video ${fileStats.size} bytes ki hai; Cloudinary upload se pehle optimize ho rahi hai`
      );
      uploadPath = await compressVideoForCloudinary(filePath);
    }

    return await uploadLargeVideo(uploadPath, options);
  } catch (error) {
    console.error(
      "Cloudinary video upload error:",
      error
    );

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      error.message ||
        "Video Cloudinary par upload nahi hui",
      500
    );
  } finally {
    if (uploadPath !== filePath) {
      removeLocalFile(uploadPath);
    }
  }
}

/**
 * Thumbnail, logo, signature ya background image
 * Cloudinary par upload karta hai.
 */
export async function uploadImageToCloudinary(
  filePath,
  options = {}
) {
  ensureCloudinaryConfigured();
  ensureFileExists(filePath);

  try {
    const uploadOptions = cleanOptions({
      resource_type: "image",

      folder:
        options.folder ||
        process.env.CLOUDINARY_IMAGE_FOLDER ||
        "skillcert-ai/images",

      public_id: options.publicId,

      overwrite:
        options.overwrite ?? false,

      use_filename:
        options.publicId ? false : true,

      unique_filename:
        options.publicId ? false : true,

      transformation:
        options.transformation,

      tags: options.tags,

      context: options.context,
    });

    return await cloudinary.uploader.upload(
      filePath,
      uploadOptions
    );
  } catch (error) {
    console.error(
      "Cloudinary image upload error:",
      error
    );

    throw new AppError(
      error.message ||
        "Image Cloudinary par upload nahi hui",
      500
    );
  }
}

/**
 * Certificate PDF ko raw asset ke roop me upload karta hai.
 */
export async function uploadCertificateToCloudinary(
  filePath,
  options = {}
) {
  ensureCloudinaryConfigured();
  ensureFileExists(filePath);

  try {
    const uploadOptions = cleanOptions({
      resource_type: "raw",

      folder:
        options.folder ||
        process.env
          .CLOUDINARY_CERTIFICATE_FOLDER ||
        "skillcert-ai/certificates",

      public_id: options.publicId,

      overwrite:
        options.overwrite ?? false,

      use_filename:
        options.publicId ? false : true,

      unique_filename:
        options.publicId ? false : true,

      tags: options.tags,
    });

    return await cloudinary.uploader.upload(
      filePath,
      uploadOptions
    );
  } catch (error) {
    console.error(
      "Cloudinary certificate upload error:",
      error
    );

    throw new AppError(
      error.message ||
        "Certificate Cloudinary par upload nahi hua",
      500
    );
  }
}

/**
 * Cloudinary asset delete karta hai.
 *
 * resourceType:
 * image | video | raw
 */
export async function deleteCloudinaryAsset(
  publicId,
  resourceType = "image"
) {
  ensureCloudinaryConfigured();

  if (!publicId) {
    return {
      result: "not_found",
    };
  }

  try {
    return await cloudinary.uploader.destroy(
      publicId,
      {
        resource_type: resourceType,
        type: "upload",
        invalidate: true,
      }
    );
  } catch (error) {
    console.error(
      "Cloudinary asset delete error:",
      error
    );

    throw new AppError(
      error.message ||
        "Cloudinary asset delete nahi hua",
      500
    );
  }
}

/**
 * Cloudinary asset ki information fetch karta hai.
 */
export async function getCloudinaryAssetDetails(
  publicId,
  resourceType = "image"
) {
  ensureCloudinaryConfigured();

  if (!publicId) {
    throw new AppError(
      "Cloudinary public ID required hai",
      400
    );
  }

  try {
    return await cloudinary.api.resource(
      publicId,
      {
        resource_type: resourceType,
        type: "upload",
      }
    );
  } catch (error) {
    console.error(
      "Cloudinary asset details error:",
      error
    );

    throw new AppError(
      error.message ||
        "Cloudinary asset details nahi mili",
      500
    );
  }
}

/**
 * Local temporary file safely delete karta hai.
 */
export function removeLocalFile(filePath) {
  if (!filePath) {
    return false;
  }

  try {
    if (!fs.existsSync(filePath)) {
      return false;
    }

    fs.unlinkSync(filePath);

    return true;
  } catch (error) {
    console.error(
      `Local file delete nahi hui: ${filePath}`,
      error.message
    );

    return false;
  }
}

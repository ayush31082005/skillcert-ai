import fs from "node:fs";
import path from "node:path";

import multer from "multer";

const uploadDirectories = {
  video: path.join(process.cwd(), "uploads", "videos"),
  thumbnail: path.join(
    process.cwd(),
    "uploads",
    "thumbnails"
  ),
};

Object.values(uploadDirectories).forEach((directory) => {
  fs.mkdirSync(directory, {
    recursive: true,
  });
});

const storage = multer.diskStorage({
  destination(request, file, callback) {
    if (file.fieldname === "thumbnail") {
      return callback(
        null,
        uploadDirectories.thumbnail
      );
    }

    callback(null, uploadDirectories.video);
  },

  filename(request, file, callback) {
    const safeOriginalName = file.originalname
      .replace(/\s+/g, "-")
      .replace(/[^a-zA-Z0-9.\-_]/g, "");

    const fileName = `${Date.now()}-${safeOriginalName}`;

    callback(null, fileName);
  },
});

function fileFilter(request, file, callback) {
  if (file.fieldname === "video") {
    if (!file.mimetype.startsWith("video/")) {
      return callback(
        new Error("Sirf video file upload kar sakte hain")
      );
    }
  }

  if (file.fieldname === "thumbnail") {
    if (!file.mimetype.startsWith("image/")) {
      return callback(
        new Error(
          "Thumbnail ke liye image required hai"
        )
      );
    }
  }

  callback(null, true);
}

const maxVideoSize =
  Number(process.env.MAX_VIDEO_SIZE_MB || 500) *
  1024 *
  1024;

export const videoUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: maxVideoSize,
  },
}).fields([
  {
    name: "video",
    maxCount: 1,
  },
  {
    name: "thumbnail",
    maxCount: 1,
  },
]);
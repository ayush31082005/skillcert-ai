import express from "express";

import {
  deleteVideo,
  getCourseVideos,
  getProcessingStatus,
  getVideo,
  retryProcessing,
  updateVideo,
  uploadVideo,
} from "../controllers/videoController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  adminOnly,
} from "../middleware/adminMiddleware.js";

import {
  videoUpload,
} from "../middleware/uploadMiddleware.js";

import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

/*
 * Admin video upload
 */
router.post(
  "/upload",
  protect,
  adminOnly,
  videoUpload,
  asyncHandler(uploadVideo)
);

/*
 * Course ke videos
 */
router.get(
  "/course/:courseId",
  protect,
  asyncHandler(getCourseVideos)
);

/*
 * Admin processing status
 */
router.get(
  "/:videoId/status",
  protect,
  adminOnly,
  asyncHandler(getProcessingStatus)
);

/*
 * Admin processing retry
 */
router.post(
  "/:videoId/retry",
  protect,
  adminOnly,
  asyncHandler(retryProcessing)
);

/*
 * Admin video update
 */
router.put(
  "/:videoId",
  protect,
  adminOnly,
  asyncHandler(updateVideo)
);

/*
 * Admin video delete
 */
router.delete(
  "/:videoId",
  protect,
  adminOnly,
  asyncHandler(deleteVideo)
);

/*
 * Single video details
 */
router.get(
  "/:videoId",
  protect,
  asyncHandler(getVideo)
);

export default router;
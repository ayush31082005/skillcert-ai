import express from "express";

import {
  createCourse,
  deleteCourse,
  getAdminCourses,
  getCourseById,
  getPublishedCourses,
  publishCourse,
  updateCourse,
} from "../controllers/courseController.js";
import { adminOnly } from "../middleware/adminMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";
import asyncHandler from "../utils/asyncHandler.js";

const router = express.Router();

router.post(
  "/",
  protect,
  adminOnly,
  asyncHandler(createCourse)
);

router.get(
  "/",
  asyncHandler(getPublishedCourses)
);

router.get(
  "/admin/all",
  protect,
  adminOnly,
  asyncHandler(getAdminCourses)
);

router.put(
  "/:courseId",
  protect,
  adminOnly,
  asyncHandler(updateCourse)
);

router.patch(
  "/:courseId/publish",
  protect,
  adminOnly,
  asyncHandler(publishCourse)
);

router.delete(
  "/:courseId",
  protect,
  adminOnly,
  asyncHandler(deleteCourse)
);

router.get(
  "/:courseId",
  asyncHandler(getCourseById)
);

export default router;

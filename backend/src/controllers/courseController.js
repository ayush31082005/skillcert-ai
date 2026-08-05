import Course from "../models/Course.js";
import Video from "../models/Video.js";
import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";

export async function createCourse(
  request,
  response
) {
  const {
    title,
    description,
    thumbnail,
    category,
    level,
    numberOfQuestions,
    passingPercentage,
    testDurationMinutes,
    maximumAttempts,
    questionTypes,
  } = request.body;

  if (!title || !description) {
    throw new AppError(
      "Course title aur description required hain",
      400
    );
  }

  const course = await Course.create({
    title,
    description,
    thumbnail: thumbnail || "",
    category: category || "General",
    level: level || "beginner",
    numberOfQuestions:
      Number(numberOfQuestions) || 10,
    passingPercentage:
      Number(passingPercentage) || 70,
    testDurationMinutes:
      Number(testDurationMinutes) || 20,
    maximumAttempts:
      Number(maximumAttempts) || 3,
    questionTypes:
      Array.isArray(questionTypes) &&
      questionTypes.length > 0
        ? questionTypes
        : ["mcq"],
    createdBy: request.user._id,
  });

  return sendSuccess(response, {
    statusCode: 201,
    message: "Course created successfully",
    data: {
      course,
    },
  });
}

export async function getPublishedCourses(
  request,
  response
) {
  const courses = await Course.find({
    status: "published",
  })
    .populate("createdBy", "name")
    .sort({
      createdAt: -1,
    })
    .lean();

  /*
   * Course create karte waqt optional `thumbnail` URL save ho sakta hai,
   * jabki video upload form image ko Video.thumbnailUrl me rakhta hai.
   * Public library ko wahi uploaded image dene ke liye har course ke first
   * ordered lesson ka thumbnail fallback ke roop me attach karte hain.
   */
  const videos = await Video.find({
    courseId: {
      $in: courses.map((course) => course._id),
    },
    processingStatus: "completed",
  })
    .select(
      "courseId title description thumbnailUrl videoUrl duration order"
    )
    .sort({
      courseId: 1,
      order: 1,
      createdAt: 1,
    })
    .lean();

  const firstLessonByCourse = new Map();
  const lessonCountByCourse = new Map();

  for (const video of videos) {
    const courseId = String(video.courseId);

    lessonCountByCourse.set(
      courseId,
      (lessonCountByCourse.get(courseId) || 0) + 1
    );

    if (!firstLessonByCourse.has(courseId)) {
      firstLessonByCourse.set(courseId, video);
    }
  }

  const coursesWithThumbnails = courses.map((course) => {
    const firstLesson = firstLessonByCourse.get(
      String(course._id)
    );

    return {
      ...course,
      thumbnail:
        course.thumbnail ||
        firstLesson?.thumbnailUrl ||
        "",
      lessonTitle: firstLesson?.title || "",
      lessonDescription:
        firstLesson?.description || "",
      lessonDuration:
        firstLesson?.duration || 0,
      lessonVideoUrl:
        firstLesson?.videoUrl || "",
      lessonCount:
        lessonCountByCourse.get(String(course._id)) || 0,
    };
  });

  return sendSuccess(response, {
    message: "Courses fetched",
    data: {
      courses: coursesWithThumbnails,
    },
  });
}

export async function getAdminCourses(
  request,
  response
) {
  const courses = await Course.find()
    .populate("createdBy", "name email")
    .sort({
      createdAt: -1,
    });

  return sendSuccess(response, {
    message: "Admin courses fetched",
    data: {
      courses,
    },
  });
}

export async function getCourseById(
  request,
  response
) {
  const course = await Course.findOne({
    _id: request.params.courseId,
    status: "published",
  }).populate("createdBy", "name");

  if (!course) {
    throw new AppError("Course nahi mila", 404);
  }

  const videos = await Video.find({
    courseId: course._id,
  })
    .select(
      "-transcript -filePath -processingError"
    )
    .sort({
      order: 1,
    });

  return sendSuccess(response, {
    message: "Course details fetched",
    data: {
      course,
      videos,
    },
  });
}

export async function updateCourse(
  request,
  response
) {
  const allowedFields = [
    "title",
    "description",
    "thumbnail",
    "category",
    "level",
    "numberOfQuestions",
    "passingPercentage",
    "testDurationMinutes",
    "maximumAttempts",
    "questionTypes",
  ];

  const updates = {};

  allowedFields.forEach((field) => {
    if (request.body[field] !== undefined) {
      updates[field] = request.body[field];
    }
  });

  const course = await Course.findByIdAndUpdate(
    request.params.courseId,
    updates,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!course) {
    throw new AppError("Course nahi mila", 404);
  }

  return sendSuccess(response, {
    message: "Course updated successfully",
    data: {
      course,
    },
  });
}

export async function publishCourse(
  request,
  response
) {
  const course = await Course.findById(
    request.params.courseId
  );

  if (!course) {
    throw new AppError("Course nahi mila", 404);
  }

  const completedVideos = await Video.countDocuments({
    courseId: course._id,
    processingStatus: "completed",
  });

  if (completedVideos === 0) {
    throw new AppError(
      "Course publish karne se pehle ek processed video required hai",
      400
    );
  }

  course.status = "published";

  await course.save();

  return sendSuccess(response, {
    message: "Course published successfully",
    data: {
      course,
    },
  });
}

export async function deleteCourse(
  request,
  response
) {
  const course = await Course.findByIdAndDelete(
    request.params.courseId
  );

  if (!course) {
    throw new AppError("Course nahi mila", 404);
  }

  return sendSuccess(response, {
    message: "Course deleted successfully",
  });
}

import Course from "../models/Course.js";
import Test from "../models/Test.js";
import Video from "../models/Video.js";
import VideoProgress from "../models/VideoProgress.js";
import { AppError } from "../utils/apiResponse.js";
import { generateQuestions } from "./llmService.js";

export async function createTestForUser({
  userId,
  videoId,
}) {
  /*
   * Video schema me transcript select:false hai taaki woh normal API
   * responses me leak na ho. Test generation ko transcript chahiye,
   * isliye is internal query me explicitly include karna zaroori hai.
   */
  const video = await Video.findById(
    videoId
  ).select("+transcript");

  if (!video) {
    throw new AppError("Video nahi mila", 404);
  }

  const course = await Course.findById(video.courseId);

  if (!course) {
    throw new AppError("Course nahi mila", 404);
  }

  const progress = await VideoProgress.findOne({
    userId,
    videoId,
  });

  if (!progress?.completed) {
    throw new AppError(
      "Test se pehle video complete karna zaroori hai",
      403
    );
  }

  if (
    video.processingStatus !== "completed" ||
    !video.transcript
  ) {
    throw new AppError(
      "Video analysis abhi complete nahi hui",
      409
    );
  }

  const activeTest = await Test.findOne({
    userId,
    videoId,
    status: {
      $in: ["generated", "started"],
    },
  });

  if (activeTest) {
    return activeTest;
  }

  const completedAttempts = await Test.countDocuments({
    userId,
    videoId,
    status: {
      $in: [
        "submitted",
        "review_required",
      ],
    },
  });

  if (completedAttempts >= course.maximumAttempts) {
    throw new AppError(
      "Maximum test attempts complete ho chuke hain",
      403
    );
  }

  const generatedQuestions =
    await generateQuestions({
      transcript: video.transcript,
      count: course.numberOfQuestions,
      allowedTypes:
        course.questionTypes.length > 0
          ? course.questionTypes
          : ["mcq"],
    });

  const test = await Test.create({
    userId,
    courseId: course._id,
    videoId: video._id,
    attemptNumber: completedAttempts + 1,
    questions: generatedQuestions,
    totalQuestions: generatedQuestions.length,
    status: "generated",
  });

  return test;
}

import Certificate from "../models/Certificate.js";
import Test from "../models/Test.js";
import User from "../models/User.js";
import VideoProgress from "../models/VideoProgress.js";
import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";

export async function getStudents(
  request,
  response
) {
  const students = await User.find({
    role: "student",
  })
    .select("-password")
    .sort({
      createdAt: -1,
    });

  return sendSuccess(response, {
    message: "Students fetched",
    data: {
      students,
    },
  });
}

export async function getStudentDetails(
  request,
  response
) {
  const student = await User.findOne({
    _id: request.params.userId,
    role: "student",
  });

  if (!student) {
    throw new AppError(
      "Student nahi mila",
      404
    );
  }

  const [progress, tests, certificates] =
    await Promise.all([
      VideoProgress.find({
        userId: student._id,
      })
        .populate("courseId", "title")
        .populate("videoId", "title"),

      Test.find({
        userId: student._id,
      })
        .populate("courseId", "title")
        .populate("videoId", "title"),

      Certificate.find({
        userId: student._id,
      }).populate("courseId", "title"),
    ]);

  return sendSuccess(response, {
    message: "Student details fetched",
    data: {
      student,
      progress,
      tests,
      certificates,
    },
  });
}
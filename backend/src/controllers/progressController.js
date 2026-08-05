import Video from "../models/Video.js";
import Course from "../models/Course.js";
import VideoProgress from "../models/VideoProgress.js";
import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";
import { createTestForUser } from "../services/testService.js";

function mergeRanges(ranges) {
  if (!ranges.length) {
    return [];
  }

  const sortedRanges = [...ranges].sort(
    (first, second) => first.start - second.start
  );

  const merged = [
    {
      start: sortedRanges[0].start,
      end: sortedRanges[0].end,
    },
  ];

  for (let index = 1; index < sortedRanges.length; index++) {
    const current = sortedRanges[index];
    const previous = merged[merged.length - 1];

    if (current.start <= previous.end + 1) {
      previous.end = Math.max(
        previous.end,
        current.end
      );
    } else {
      merged.push({
        start: current.start,
        end: current.end,
      });
    }
  }

  return merged;
}

function calculateWatchedSeconds(ranges) {
  return ranges.reduce(
    (total, range) =>
      total + Math.max(0, range.end - range.start),
    0
  );
}

export async function updateProgress(
  request,
  response
) {
  const {
    currentTime,
    duration,
    isPlaying = true,
  } = request.body;

  const numericCurrentTime = Number(currentTime);
  const numericDuration = Number(duration);

  if (
    !Number.isFinite(numericCurrentTime) ||
    numericCurrentTime < 0
  ) {
    throw new AppError(
      "Valid currentTime required hai",
      400
    );
  }

  const video = await Video.findById(
    request.params.videoId
  );

  if (!video) {
    throw new AppError("Video nahi mila", 404);
  }

  const actualDuration =
    Number(video.duration) > 0
      ? Number(video.duration)
      : numericDuration;

  if (!actualDuration) {
    throw new AppError(
      "Video duration available nahi hai",
      400
    );
  }

  let progress = await VideoProgress.findOne({
    userId: request.user._id,
    videoId: video._id,
  });

  if (!progress) {
    progress = await VideoProgress.create({
      userId: request.user._id,
      courseId: video.courseId,
      videoId: video._id,
      lastHeartbeatAt: new Date(),
    });
  }

  const wasCompleted = progress.completed;

  const now = new Date();

  const elapsedSeconds = progress.lastHeartbeatAt
    ? Math.max(
        0,
        (now.getTime() -
          progress.lastHeartbeatAt.getTime()) /
          1000
      )
    : 10;

  const forwardDifference =
    numericCurrentTime - progress.lastPosition;

  const allowedForwardSeconds =
    Math.max(elapsedSeconds, 1) + 5;

  if (
    forwardDifference > allowedForwardSeconds &&
    numericCurrentTime >
      progress.maximumWatchedPosition + 5
  ) {
    progress.suspiciousJumpCount += 1;
    progress.lastHeartbeatAt = now;

    await progress.save();

    throw new AppError(
      "Video ko bina dekhe aage skip nahi kar sakte",
      400,
      {
        allowedPosition:
          progress.maximumWatchedPosition,
      }
    );
  }

  const updatedRanges = [
    ...progress.watchedRanges.map((range) => ({
      start: range.start,
      end: range.end,
    })),
  ];

  if (
    isPlaying &&
    numericCurrentTime >= progress.lastPosition &&
    forwardDifference >= 0 &&
    forwardDifference <= allowedForwardSeconds
  ) {
    updatedRanges.push({
      start: Math.max(0, progress.lastPosition),
      end: Math.min(
        numericCurrentTime,
        actualDuration
      ),
    });
  }

  /*
   * Browser ka `ended` event paused state report karta hai. Time-update ke
   * interval ki wajah se final 3-5 seconds range se chhoot sakte hain.
   * User already video ke end tak naturally pahunch chuka ho to final segment
   * include karo, taaki genuine completion 93-94% par stuck na rahe.
   */
  if (
    numericCurrentTime >= actualDuration - 1 &&
    (
      progress.lastPosition >= actualDuration - 5 ||
      progress.maximumWatchedPosition >=
        actualDuration - 5
    )
  ) {
    updatedRanges.push({
      start: Math.max(0, actualDuration - 6),
      end: actualDuration,
    });
  }

  const mergedRanges = mergeRanges(updatedRanges);

  const watchedSeconds =
    calculateWatchedSeconds(mergedRanges);

  const progressPercentage = Math.min(
    100,
    (watchedSeconds / actualDuration) * 100
  );

  const maximumWatchedPosition = Math.max(
    progress.maximumWatchedPosition,
    numericCurrentTime
  );

  const completed =
    progressPercentage >= 95 &&
    maximumWatchedPosition >= actualDuration - 5;

  progress.lastPosition = Math.min(
    numericCurrentTime,
    actualDuration
  );

  progress.maximumWatchedPosition =
    maximumWatchedPosition;

  progress.watchedRanges = mergedRanges;
  progress.watchedSeconds = watchedSeconds;
  progress.progressPercentage = progressPercentage;
  progress.completed = completed;
  progress.lastHeartbeatAt = now;

  if (completed && !progress.completedAt) {
    progress.completedAt = now;
  }

  await progress.save();

  if (!wasCompleted && completed) {
    setImmediate(() => {
      createTestForUser({
        userId: request.user._id,
        videoId: video._id,
      }).catch((error) => {
        console.error(
          "Automatic test generation failed:",
          error.message
        );
      });
    });
  }

  return sendSuccess(response, {
    message: completed
      ? "Video completed. Test generation start ho gayi."
      : "Video progress saved",
    data: {
      progress: {
        lastPosition: progress.lastPosition,
        maximumWatchedPosition:
          progress.maximumWatchedPosition,
        watchedSeconds: progress.watchedSeconds,
        progressPercentage:
          progress.progressPercentage,
        completed: progress.completed,
        suspiciousJumpCount:
          progress.suspiciousJumpCount,
      },
    },
  });
}

export async function getProgress(
  request,
  response
) {
  const progress = await VideoProgress.findOne({
    userId: request.user._id,
    videoId: request.params.videoId,
  });

  return sendSuccess(response, {
    message: "Video progress fetched",
    data: {
      progress:
        progress ||
        {
          lastPosition: 0,
          maximumWatchedPosition: 0,
          watchedSeconds: 0,
          progressPercentage: 0,
          completed: false,
        },
    },
  });
}

export async function getMyLearning(
  request,
  response
) {
  const courses = await Course.find({
    status: "published",
  })
    .select("title description thumbnail category level")
    .lean();

  const videos = await Video.find({
    courseId: {
      $in: courses.map((course) => course._id),
    },
    processingStatus: "completed",
  })
    .select(
      "courseId title description thumbnailUrl duration order processingStatus topics"
    )
    .sort({
      courseId: 1,
      order: 1,
    })
    .lean();

  const progressRecords = await VideoProgress.find({
    userId: request.user._id,
    videoId: {
      $in: videos.map((video) => video._id),
    },
  }).lean();

  const progressByVideo = new Map(
    progressRecords.map((progress) => [
      String(progress.videoId),
      progress,
    ])
  );

  const courseById = new Map(
    courses.map((course) => [
      String(course._id),
      course,
    ])
  );

  const learning = videos.map((video) => {
    const savedProgress =
      progressByVideo.get(String(video._id));

    return {
      video,
      course: courseById.get(
        String(video.courseId)
      ),
      progress: savedProgress
        ? {
            lastPosition:
              savedProgress.lastPosition,
            watchedSeconds:
              savedProgress.watchedSeconds,
            progressPercentage:
              savedProgress.progressPercentage,
            completed: savedProgress.completed,
            updatedAt: savedProgress.updatedAt,
          }
        : {
            lastPosition: 0,
            watchedSeconds: 0,
            progressPercentage: 0,
            completed: false,
            updatedAt: null,
          },
    };
  });

  learning.sort((first, second) => {
    if (
      first.progress.completed !==
      second.progress.completed
    ) {
      return first.progress.completed ? 1 : -1;
    }

    return (
      new Date(
        second.progress.updatedAt || 0
      ).getTime() -
      new Date(
        first.progress.updatedAt || 0
      ).getTime()
    );
  });

  return sendSuccess(response, {
    message: "My learning progress fetched",
    data: {
      learning,
    },
  });
}

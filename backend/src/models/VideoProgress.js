import mongoose from "mongoose";

const watchedRangeSchema = new mongoose.Schema(
  {
    start: {
      type: Number,
      required: true,
    },

    end: {
      type: Number,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const videoProgressSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },

    videoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video",
      required: true,
      index: true,
    },

    lastPosition: {
      type: Number,
      default: 0,
    },

    maximumWatchedPosition: {
      type: Number,
      default: 0,
    },

    watchedRanges: {
      type: [watchedRangeSchema],
      default: [],
    },

    watchedSeconds: {
      type: Number,
      default: 0,
    },

    progressPercentage: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },

    lastHeartbeatAt: {
      type: Date,
      default: null,
    },

    suspiciousJumpCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

videoProgressSchema.index(
  {
    userId: 1,
    videoId: 1,
  },
  {
    unique: true,
  }
);

const VideoProgress =
  mongoose.models.VideoProgress ||
  mongoose.model("VideoProgress", videoProgressSchema);

export default VideoProgress;
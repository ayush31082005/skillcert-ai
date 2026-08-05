import mongoose from "mongoose";

const questionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["mcq", "true_false", "short_answer"],
      default: "mcq",
    },

    question: {
      type: String,
      required: true,
    },

    options: {
      type: [String],
      default: [],
    },

    correctAnswer: {
      type: String,
      default: "",
    },

    idealAnswer: {
      type: String,
      default: "",
    },

    explanation: {
      type: String,
      default: "",
    },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },

    sourceTimestamp: {
      type: Number,
      default: 0,
    },

    userAnswer: {
      type: String,
      default: "",
    },

    isCorrect: {
      type: Boolean,
      default: null,
    },

    scoreAwarded: {
      type: Number,
      default: 0,
    },

    maximumScore: {
      type: Number,
      default: 1,
    },

    aiFeedback: {
      type: String,
      default: "",
    },

    gradingConfidence: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: false,
  }
);

const testSchema = new mongoose.Schema(
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
    },

    attemptNumber: {
      type: Number,
      required: true,
    },

    questions: {
      type: [questionSchema],
      default: [],
    },

    status: {
      type: String,
      enum: [
        "generated",
        "started",
        "submitted",
        "review_required"
      ],
      default: "generated",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    totalQuestions: {
      type: Number,
      default: 0,
    },

    correctAnswers: {
      type: Number,
      default: 0,
    },

    wrongAnswers: {
      type: Number,
      default: 0,
    },

    score: {
      type: Number,
      default: 0,
    },

    passed: {
      type: Boolean,
      default: false,
    },

    adminReviewed: {
      type: Boolean,
      default: false,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

testSchema.index(
  {
    userId: 1,
    videoId: 1,
    attemptNumber: 1,
  },
  {
    unique: true,
  }
);

const Test =
  mongoose.models.Test || mongoose.model("Test", testSchema);

export default Test;
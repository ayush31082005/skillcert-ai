import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Course title required hai"],
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      required: [true, "Course description required hai"],
      trim: true,
    },

    thumbnail: {
      type: String,
      default: "",
    },

    category: {
      type: String,
      default: "General",
      trim: true,
    },

    level: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "beginner",
    },

    status: {
      type: String,
      enum: ["draft", "published", "inactive"],
      default: "draft",
    },

    numberOfQuestions: {
      type: Number,
      min: 1,
      max: 50,
      default: 10,
    },

    passingPercentage: {
      type: Number,
      min: 1,
      max: 100,
      default: 70,
    },

    testDurationMinutes: {
      type: Number,
      min: 1,
      default: 20,
    },

    maximumAttempts: {
      type: Number,
      min: 1,
      default: 3,
    },

    questionTypes: {
      type: [String],
      enum: ["mcq", "true_false", "short_answer"],
      default: ["mcq"],
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Course =
  mongoose.models.Course ||
  mongoose.model("Course", courseSchema);

export default Course;
import Certificate from "../models/Certificate.js";
import Course from "../models/Course.js";
import Test from "../models/Test.js";
import {
  AppError,
  sendSuccess,
} from "../utils/apiResponse.js";
import { gradeWrittenAnswers } from "../services/llmService.js";
import { createTestForUser } from "../services/testService.js";
import { generateCertificateForTest } from "../services/certificateService.js";

function normalizeAnswer(answer) {
  return String(answer || "")
    .trim()
    .toLowerCase();
}

function safeTestForStudent(test) {
  return {
    id: test._id,
    courseId: test.courseId,
    videoId: test.videoId,
    attemptNumber: test.attemptNumber,
    status: test.status,
    totalQuestions: test.totalQuestions,
    startedAt: test.startedAt,
    questions: test.questions.map((question) => ({
      id: question._id,
      type: question.type,
      question: question.question,
      options: question.options,
      difficulty: question.difficulty,
      sourceTimestamp: question.sourceTimestamp,
    })),
  };
}

export async function generateTest(
  request,
  response
) {
  const { videoId } = request.body;

  if (!videoId) {
    throw new AppError(
      "videoId required hai",
      400
    );
  }

  const test = await createTestForUser({
    userId: request.user._id,
    videoId,
  });

  return sendSuccess(response, {
    statusCode: 201,
    message: "Test generated successfully",
    data: {
      test: safeTestForStudent(test),
    },
  });
}

export async function getTest(
  request,
  response
) {
  const test = await Test.findOne({
    _id: request.params.testId,
    userId: request.user._id,
  });

  if (!test) {
    throw new AppError("Test nahi mila", 404);
  }

  return sendSuccess(response, {
    message: "Test fetched",
    data: {
      test: safeTestForStudent(test),
    },
  });
}

export async function startTest(
  request,
  response
) {
  const test = await Test.findOne({
    _id: request.params.testId,
    userId: request.user._id,
  });

  if (!test) {
    throw new AppError("Test nahi mila", 404);
  }

  if (
    !["generated", "started"].includes(test.status)
  ) {
    throw new AppError(
      "Ye test dobara start nahi ho sakta",
      400
    );
  }

  if (!test.startedAt) {
    test.startedAt = new Date();
    test.status = "started";

    await test.save();
  }

  return sendSuccess(response, {
    message: "Test started",
    data: {
      test: safeTestForStudent(test),
    },
  });
}

export async function submitTest(
  request,
  response
) {
  const { answers } = request.body;

  if (!Array.isArray(answers)) {
    throw new AppError(
      "Answers array required hai",
      400
    );
  }

  const test = await Test.findOne({
    _id: request.params.testId,
    userId: request.user._id,
  });

  if (!test) {
    throw new AppError("Test nahi mila", 404);
  }

  if (
    !["generated", "started"].includes(test.status)
  ) {
    throw new AppError(
      "Test pehle hi submit ho chuka hai",
      400
    );
  }

  const course = await Course.findById(
    test.courseId
  );

  if (!course) {
    throw new AppError("Course nahi mila", 404);
  }

  const answerMap = new Map(
    answers.map((answer) => [
      String(answer.questionId),
      String(answer.answer ?? ""),
    ])
  );

  const writtenItems = [];

  test.questions.forEach((question) => {
    const userAnswer =
      answerMap.get(String(question._id)) || "";

    question.userAnswer = userAnswer;

    if (
      question.type === "mcq" ||
      question.type === "true_false"
    ) {
      const isCorrect =
        normalizeAnswer(userAnswer) ===
        normalizeAnswer(question.correctAnswer);

      question.isCorrect = isCorrect;
      question.scoreAwarded = isCorrect ? 1 : 0;
      question.gradingConfidence = 1;

      question.aiFeedback = isCorrect
        ? "Correct answer"
        : question.explanation;
    }

    if (question.type === "short_answer") {
      writtenItems.push({
        questionId: String(question._id),
        question: question.question,
        idealAnswer: question.idealAnswer,
        studentAnswer: userAnswer,
      });
    }
  });

  const writtenGrades =
    await gradeWrittenAnswers(writtenItems);

  const writtenGradeMap = new Map(
    writtenGrades.map((grade) => [
      String(grade.questionId),
      grade,
    ])
  );

  let reviewRequired = false;

  test.questions.forEach((question) => {
    if (question.type !== "short_answer") {
      return;
    }

    const grade = writtenGradeMap.get(
      String(question._id)
    );

    question.isCorrect =
      grade?.isCorrect || false;

    question.scoreAwarded =
      grade?.score || 0;

    question.gradingConfidence =
      grade?.confidence || 0;

    question.aiFeedback =
      grade?.feedback ||
      "Answer grade nahi ho paya";

    if ((grade?.confidence || 0) < 0.7) {
      reviewRequired = true;
    }
  });

  const maximumScore = test.questions.reduce(
    (total, question) =>
      total + question.maximumScore,
    0
  );

  const scoreAwarded = test.questions.reduce(
    (total, question) =>
      total + question.scoreAwarded,
    0
  );

  const score =
    maximumScore > 0
      ? (scoreAwarded / maximumScore) * 100
      : 0;

  const correctAnswers = test.questions.filter(
    (question) => question.isCorrect
  ).length;

  test.correctAnswers = correctAnswers;
  test.wrongAnswers =
    test.questions.length - correctAnswers;

  test.score = Number(score.toFixed(2));
  test.passed =
    score >= course.passingPercentage;

  test.submittedAt = new Date();

  test.status = reviewRequired
    ? "review_required"
    : "submitted";

  await test.save();

  let certificate = null;

  if (test.passed && !reviewRequired) {
    certificate =
      await generateCertificateForTest(test._id);
  }

  return sendSuccess(response, {
    message: reviewRequired
      ? "Test submit hua. AI confidence kam hone ke karan admin review required hai."
      : test.passed
        ? "Test passed. Certificate generate ho gaya."
        : "Test submit hua, lekin aap pass nahi hue.",
    data: {
      result: {
        totalQuestions: test.totalQuestions,
        correctAnswers: test.correctAnswers,
        wrongAnswers: test.wrongAnswers,
        score: test.score,
        passingPercentage:
          course.passingPercentage,
        passed: test.passed,
        status: test.status,
      },
      certificate,
    },
  });
}

export async function getResult(
  request,
  response
) {
  const test = await Test.findOne({
    _id: request.params.testId,
    userId: request.user._id,
  })
    .populate("courseId", "title passingPercentage")
    .select("-questions.correctAnswer");

  if (!test) {
    throw new AppError("Test nahi mila", 404);
  }

  const certificate = await Certificate.findOne({
    testId: test._id,
  });

  return sendSuccess(response, {
    message: "Test result fetched",
    data: {
      test,
      certificate,
    },
  });
}

export async function getMyTests(
  request,
  response
) {
  const tests = await Test.find({
    userId: request.user._id,
  })
    .populate("courseId", "title")
    .populate("videoId", "title")
    .select("-questions.correctAnswer")
    .sort({
      createdAt: -1,
    });

  return sendSuccess(response, {
    message: "User tests fetched",
    data: {
      tests,
    },
  });
}

export async function getAdminTests(
  request,
  response
) {
  const tests = await Test.find()
    .populate("userId", "name email")
    .populate("courseId", "title")
    .populate("videoId", "title")
    .sort({
      createdAt: -1,
    });

  return sendSuccess(response, {
    message: "Admin test records fetched",
    data: {
      tests,
    },
  });
}

export async function getAdminTestDetails(
  request,
  response
) {
  const test = await Test.findById(
    request.params.testId
  )
    .populate("userId", "name email")
    .populate(
      "courseId",
      "title passingPercentage"
    )
    .populate("videoId", "title");

  if (!test) {
    throw new AppError("Test nahi mila", 404);
  }

  return sendSuccess(response, {
    message: "Test details fetched",
    data: {
      test,
    },
  });
}

export async function reviewTest(
  request,
  response
) {
  const { answers } = request.body;

  const test = await Test.findById(
    request.params.testId
  );

  if (!test) {
    throw new AppError("Test nahi mila", 404);
  }

  if (!Array.isArray(answers)) {
    throw new AppError(
      "Reviewed answers array required hai",
      400
    );
  }

  const reviewMap = new Map(
    answers.map((answer) => [
      String(answer.questionId),
      answer,
    ])
  );

  test.questions.forEach((question) => {
    const review = reviewMap.get(
      String(question._id)
    );

    if (!review) {
      return;
    }

    question.isCorrect = Boolean(
      review.isCorrect
    );

    question.scoreAwarded = Math.max(
      0,
      Math.min(
        question.maximumScore,
        Number(review.scoreAwarded || 0)
      )
    );

    question.aiFeedback =
      review.feedback ||
      question.aiFeedback;

    question.gradingConfidence = 1;
  });

  const course = await Course.findById(
    test.courseId
  );

  const maximumScore = test.questions.reduce(
    (total, question) =>
      total + question.maximumScore,
    0
  );

  const awardedScore = test.questions.reduce(
    (total, question) =>
      total + question.scoreAwarded,
    0
  );

  test.score =
    maximumScore > 0
      ? Number(
          (
            (awardedScore / maximumScore) *
            100
          ).toFixed(2)
        )
      : 0;

  test.correctAnswers = test.questions.filter(
    (question) => question.isCorrect
  ).length;

  test.wrongAnswers =
    test.questions.length -
    test.correctAnswers;

  test.passed =
    test.score >= course.passingPercentage;

  test.status = "submitted";
  test.adminReviewed = true;
  test.reviewedBy = request.user._id;

  await test.save();

  let certificate = null;

  if (test.passed) {
    certificate =
      await generateCertificateForTest(
        test._id,
        request.user._id
      );
  }

  return sendSuccess(response, {
    message: "Test review complete",
    data: {
      test,
      certificate,
    },
  });
}
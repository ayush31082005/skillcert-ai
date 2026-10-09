import fs from "node:fs";
import path from "node:path";

import OpenAI from "openai";

import { AppError } from "../utils/apiResponse.js";

/*
 * OpenAI client ko baar-baar create karne ki jagah
 * ek hi client reuse karenge.
 */
let openAIClient = null;

function getApiKey() {
  return (
    process.env.GROQ_API_KEY ||
    process.env.OPENAI_API_KEY
  );
}

function isGroqProvider() {
  return Boolean(
    process.env.GROQ_API_KEY ||
    getApiKey()?.startsWith("gsk_")
  );
}

const VALID_QUESTION_TYPES = [
  "mcq",
  "true_false",
  "short_answer",
];

const VALID_DIFFICULTIES = [
  "easy",
  "medium",
  "hard",
];

/**
 * OpenAI API key check karke client return karta hai.
 */
function getOpenAIClient() {
  const apiKey = getApiKey();

  if (!apiKey) {
    throw new AppError(
      "GROQ_API_KEY ya OPENAI_API_KEY backend/.env file me add nahi hai",
      503
    );
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey,

      /*
       * gsk_ key Groq ki hoti hai. Groq OpenAI-compatible endpoint provide
       * karta hai, isliye wahi OpenAI SDK reuse kar sakte hain.
       */
      baseURL: isGroqProvider()
        ? "https://api.groq.com/openai/v1"
        : undefined,

      /*
       * Temporary network/API error aaye to
       * SDK request retry kar sakega.
       */
      maxRetries: 2,

      timeout: 120000,
    });
  }

  return openAIClient;
}

/**
 * Text generation model environment variable se lega.
 */
function getTextModel() {
  const configuredModel = isGroqProvider()
    ? process.env.GROQ_TEXT_MODEL ||
      "openai/gpt-oss-120b"
    : process.env.OPENAI_TEXT_MODEL;

  // Keep old local environments working after Groq retired Llama 3.3 70B.
  const model = isGroqProvider() &&
    configuredModel === "llama-3.3-70b-versatile"
    ? "openai/gpt-oss-120b"
    : configuredModel;

  if (model !== configuredModel) {
    console.warn(
      `Groq model ${configuredModel} is retired; using ${model}.`
    );
  }

  if (!model) {
    throw new AppError(
      "Text model backend/.env file me add karo",
      503
    );
  }

  return model;
}

/**
 * Audio transcription model environment variable se lega.
 */
function getTranscriptionModel() {
  const model = isGroqProvider()
    ? process.env.GROQ_TRANSCRIBE_MODEL ||
      "whisper-large-v3-turbo"
    : process.env.OPENAI_TRANSCRIBE_MODEL;

  if (!model) {
    throw new AppError(
      "Transcription model backend/.env file me add karo",
      503
    );
  }

  return model;
}

/**
 * Transcript ki maximum length control karta hai.
 *
 * Bahut bada transcript ek request me bhejne se
 * context/token limit ya cost problem ho sakti hai.
 */
function limitTranscript(transcript) {
  const maximumCharacters = Number(
    process.env.MAX_TRANSCRIPT_CHARACTERS ||
      120000
  );

  const cleanTranscript = String(
    transcript || ""
  ).trim();

  if (
    cleanTranscript.length <= maximumCharacters
  ) {
    return cleanTranscript;
  }

  /*
   * Sirf beginning lene ki jagah beginning,
   * middle aur ending se text lete hain.
   */
  const firstPartLength = Math.floor(
    maximumCharacters * 0.5
  );

  const middlePartLength = Math.floor(
    maximumCharacters * 0.25
  );

  const endingPartLength =
    maximumCharacters -
    firstPartLength -
    middlePartLength;

  const middleStart = Math.max(
    0,
    Math.floor(
      cleanTranscript.length / 2 -
        middlePartLength / 2
    )
  );

  return [
    cleanTranscript.slice(0, firstPartLength),

    "\n\n[TRANSCRIPT MIDDLE SECTION]\n\n",

    cleanTranscript.slice(
      middleStart,
      middleStart + middlePartLength
    ),

    "\n\n[TRANSCRIPT END SECTION]\n\n",

    cleanTranscript.slice(-endingPartLength),
  ].join("");
}

/**
 * Markdown code fences remove karta hai.
 */
function removeCodeFences(text) {
  return String(text || "")
    .replace(/```json/gi, "")
    .replace(/```javascript/gi, "")
    .replace(/```js/gi, "")
    .replace(/```/g, "")
    .trim();
}

/**
 * Response text me JSON object ka start/end find karta hai.
 */
function extractJsonObject(text) {
  const cleanText = removeCodeFences(text);

  if (!cleanText) {
    throw new AppError(
      "LLM ne empty response diya",
      502
    );
  }

  /*
   * Pehle direct JSON parse try karo.
   */
  try {
    return JSON.parse(cleanText);
  } catch {
    // Neeche extracted JSON parse karenge.
  }

  const objectStart = cleanText.indexOf("{");
  const objectEnd = cleanText.lastIndexOf("}");

  if (
    objectStart !== -1 &&
    objectEnd !== -1 &&
    objectEnd > objectStart
  ) {
    const possibleJson = cleanText.slice(
      objectStart,
      objectEnd + 1
    );

    try {
      return JSON.parse(possibleJson);
    } catch {
      // Final error neeche throw hoga.
    }
  }

  const arrayStart = cleanText.indexOf("[");
  const arrayEnd = cleanText.lastIndexOf("]");

  if (
    arrayStart !== -1 &&
    arrayEnd !== -1 &&
    arrayEnd > arrayStart
  ) {
    const possibleArray = cleanText.slice(
      arrayStart,
      arrayEnd + 1
    );

    try {
      return JSON.parse(possibleArray);
    } catch {
      // Final error neeche throw hoga.
    }
  }

  console.error(
    "Invalid LLM JSON response:",
    cleanText
  );

  throw new AppError(
    "LLM ne valid JSON response nahi diya",
    502
  );
}

/**
 * OpenAI API errors ko simple backend error me convert karta hai.
 */
function handleOpenAIError(error, fallbackMessage) {
  console.error("OpenAI API error:", {
    message: error?.message,
    status: error?.status,
    code: error?.code,
    type: error?.type,
  });

  if (error instanceof AppError) {
    throw error;
  }

  if (error?.status === 401) {
    throw new AppError(
      `${isGroqProvider() ? "Groq" : "OpenAI"} API key invalid hai`,
      503
    );
  }

  if (error?.status === 429) {
    throw new AppError(
      "OpenAI rate limit ya quota exceed ho gaya hai",
      429
    );
  }

  if (error?.status === 413) {
    throw new AppError(
      "OpenAI ko bheji gayi file ya input bahut bada hai",
      413
    );
  }

  if (
    error?.status >= 500 ||
    error?.code === "ECONNRESET" ||
    error?.code === "ETIMEDOUT"
  ) {
    throw new AppError(
      "OpenAI service abhi temporarily unavailable hai",
      503
    );
  }

  throw new AppError(
    error?.message || fallbackMessage,
    500
  );
}

/**
 * Responses API se text generate karta hai
 * aur JSON return karta hai.
 */
async function createJsonResponse({
  instructions,
  input,
  maximumOutputTokens = 6000,
}) {
  const client = getOpenAIClient();

  try {
    const response =
      await client.responses.create({
        model: getTextModel(),

        instructions,

        input,

        max_output_tokens:
          maximumOutputTokens,
      });

    const outputText =
      response?.output_text?.trim();

    if (!outputText) {
      throw new AppError(
        "OpenAI ne empty output diya",
        502
      );
    }

    return extractJsonObject(outputText);
  } catch (error) {
    handleOpenAIError(
      error,
      "LLM response generate nahi hua"
    );
  }
}

/**
 * Audio file ko text transcript me convert karta hai.
 *
 * VideoService is function ko har audio chunk ke
 * liye call karega.
 */
export async function transcribeAudio(
  audioPath
) {
  if (!audioPath) {
    throw new AppError(
      "Audio file path required hai",
      400
    );
  }

  if (!fs.existsSync(audioPath)) {
    throw new AppError(
      `Audio file nahi mili: ${audioPath}`,
      404
    );
  }

  const fileStats = fs.statSync(audioPath);

  if (fileStats.size === 0) {
    throw new AppError(
      "Audio file empty hai",
      400
    );
  }

  const extension = path
    .extname(audioPath)
    .toLowerCase();

  const supportedExtensions = [
    ".mp3",
    ".mp4",
    ".mpeg",
    ".mpga",
    ".m4a",
    ".wav",
    ".webm",
  ];

  if (
    !supportedExtensions.includes(extension)
  ) {
    throw new AppError(
      `Unsupported audio format: ${extension}`,
      400
    );
  }

  const client = getOpenAIClient();

  try {
    const requestData = {
      file: fs.createReadStream(audioPath),

      model: getTranscriptionModel(),
    };

    /*
     * Optional language code, example:
     * OPENAI_TRANSCRIPTION_LANGUAGE=hi
     *
     * Empty hone par OpenAI language detect karega.
     */
    if (
      process.env
        .OPENAI_TRANSCRIPTION_LANGUAGE
    ) {
      requestData.language =
        process.env
          .OPENAI_TRANSCRIPTION_LANGUAGE;
    }

    const transcription =
      await client.audio.transcriptions.create(
        requestData
      );

    const transcriptText = String(
      transcription?.text || ""
    ).trim();

    if (!transcriptText) {
      throw new AppError(
        "Audio transcript empty generate hui",
        502
      );
    }

    return transcriptText;
  } catch (error) {
    handleOpenAIError(
      error,
      "Audio transcription generate nahi hui"
    );
  }
}

/**
 * Video transcript ka summary aur topics generate karta hai.
 */
export async function analyzeTranscript(
  transcript
) {
  const cleanTranscript =
    limitTranscript(transcript);

  if (!cleanTranscript) {
    throw new AppError(
      "Transcript analysis ke liye transcript required hai",
      400
    );
  }

  const result = await createJsonResponse({
    maximumOutputTokens: 3000,

    instructions: `
You are an educational content analyst.

Analyze only the transcript supplied by the user.

Important rules:
1. Do not invent facts outside the transcript.
2. Return only valid JSON.
3. Do not return markdown.
4. Keep the summary useful for generating assessments.
5. Extract 3 to 8 meaningful educational topics from the transcript.
6. Never return an empty topics array when the transcript contains educational material.
`,

    input: `
Analyze the following educational video transcript.

Return this exact JSON structure:

{
  "summary": "A clear summary of the video content",
  "topics": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "keyPoints": [
    "Important point 1",
    "Important point 2"
  ],
  "language": "Detected transcript language"
}

Transcript:

${cleanTranscript}
`,
  });

  const summary =
    typeof result?.summary === "string"
      ? result.summary.trim()
      : "";

  const topics = Array.isArray(
    result?.topics
  )
    ? result.topics
        .filter(
          (topic) =>
            typeof topic === "string"
        )
        .map((topic) => topic.trim())
        .filter(Boolean)
        .slice(0, 30)
    : [];

  const keyPoints = Array.isArray(
    result?.keyPoints
  )
    ? result.keyPoints
        .filter(
          (point) =>
            typeof point === "string"
        )
        .map((point) => point.trim())
        .filter(Boolean)
        .slice(0, 50)
    : [];

  return {
    summary,
    topics,
    keyPoints,

    language:
      typeof result?.language === "string"
        ? result.language.trim()
        : "",
  };
}

/**
 * Question type list ko validate karta hai.
 */
function normalizeQuestionTypes(
  allowedTypes
) {
  if (!Array.isArray(allowedTypes)) {
    return ["mcq"];
  }

  const validTypes = allowedTypes.filter(
    (type) =>
      VALID_QUESTION_TYPES.includes(type)
  );

  return validTypes.length > 0
    ? [...new Set(validTypes)]
    : ["mcq"];
}

/**
 * Options ko clean aur unique karta hai.
 */
function cleanOptions(options) {
  if (!Array.isArray(options)) {
    return [];
  }

  const cleanedOptions = options
    .filter(
      (option) =>
        typeof option === "string"
    )
    .map((option) => option.trim())
    .filter(Boolean);

  return [...new Set(cleanedOptions)];
}

/**
 * LLM question ko database-compatible structure me
 * validate aur normalize karta hai.
 */
function normalizeQuestion(
  question,
  allowedTypes
) {
  if (
    !question ||
    typeof question !== "object"
  ) {
    return null;
  }

  const type = String(
    question.type || ""
  )
    .trim()
    .toLowerCase();

  if (!allowedTypes.includes(type)) {
    return null;
  }

  const questionText = String(
    question.question || ""
  ).trim();

  if (questionText.length < 5) {
    return null;
  }

  const difficulty =
    VALID_DIFFICULTIES.includes(
      question.difficulty
    )
      ? question.difficulty
      : "medium";

  const explanation = String(
    question.explanation || ""
  ).trim();

  const sourceTimestamp = Math.max(
    0,
    Number(question.sourceTimestamp) || 0
  );

  if (type === "mcq") {
    const options = cleanOptions(
      question.options
    ).slice(0, 4);

    if (options.length !== 4) {
      return null;
    }

    let correctAnswer = String(
      question.correctAnswer || ""
    ).trim();

    /*
     * LLM kabhi "A", "B", "C", "D"
     * return kar sakta hai.
     */
    const answerLetterMap = {
      A: 0,
      B: 1,
      C: 2,
      D: 3,
    };

    const answerLetter =
      correctAnswer.toUpperCase();

    if (
      Object.hasOwn(
        answerLetterMap,
        answerLetter
      )
    ) {
      correctAnswer =
        options[
          answerLetterMap[answerLetter]
        ];
    }

    const matchedOption = options.find(
      (option) =>
        option.toLowerCase() ===
        correctAnswer.toLowerCase()
    );

    if (!matchedOption) {
      return null;
    }

    return {
      type,
      question: questionText,
      options,
      correctAnswer: matchedOption,
      idealAnswer: "",
      explanation,
      difficulty,
      sourceTimestamp,
      maximumScore: 1,
    };
  }

  if (type === "true_false") {
    const options = ["True", "False"];

    const rawCorrectAnswer = String(
      question.correctAnswer || ""
    )
      .trim()
      .toLowerCase();

    let correctAnswer = "";

    if (
      ["true", "yes", "correct"].includes(
        rawCorrectAnswer
      )
    ) {
      correctAnswer = "True";
    }

    if (
      ["false", "no", "incorrect"].includes(
        rawCorrectAnswer
      )
    ) {
      correctAnswer = "False";
    }

    if (!correctAnswer) {
      return null;
    }

    return {
      type,
      question: questionText,
      options,
      correctAnswer,
      idealAnswer: "",
      explanation,
      difficulty,
      sourceTimestamp,
      maximumScore: 1,
    };
  }

  if (type === "short_answer") {
    const idealAnswer = String(
      question.idealAnswer ||
        question.correctAnswer ||
        ""
    ).trim();

    if (idealAnswer.length < 3) {
      return null;
    }

    return {
      type,
      question: questionText,
      options: [],
      correctAnswer: "",
      idealAnswer,
      explanation,
      difficulty,
      sourceTimestamp,
      maximumScore: 1,
    };
  }

  return null;
}

/**
 * Transcript ke basis par automatic test questions
 * generate karta hai.
 */
export async function generateQuestions({
  transcript,
  count = 10,
  allowedTypes = ["mcq"],
}) {
  const cleanTranscript =
    limitTranscript(transcript);

  if (!cleanTranscript) {
    throw new AppError(
      "Question generation ke liye transcript required hai",
      400
    );
  }

  const questionCount = Math.max(
    1,
    Math.min(50, Number(count) || 10)
  );

  const normalizedTypes =
    normalizeQuestionTypes(allowedTypes);

  const result = await createJsonResponse({
    maximumOutputTokens: Math.min(
      16000,
      questionCount * 1000
    ),

    instructions: `
You are an educational assessment creator.

Create questions only from the supplied video transcript.

Important rules:
1. Do not use outside knowledge.
2. Every question must be answerable from the transcript.
3. Return only valid JSON.
4. Do not return markdown.
5. Avoid duplicate or almost identical questions.
6. Use clear language suitable for students.
7. Include easy, medium and hard questions.
8. The correct answer must be unquestionably supported by the transcript.
`,

    input: `
Generate exactly ${questionCount} assessment questions.

Allowed question types:

${normalizedTypes.join(", ")}

Question rules:

MCQ:
- Must contain exactly 4 different options.
- Only one option may be correct.
- correctAnswer must contain the full exact option text.

true_false:
- options must be ["True", "False"].
- correctAnswer must be "True" or "False".

short_answer:
- options must be [].
- Include an idealAnswer.
- idealAnswer should explain the expected correct response.

Return this exact JSON structure:

{
  "questions": [
    {
      "type": "mcq",
      "question": "Question text",
      "options": [
        "Option 1",
        "Option 2",
        "Option 3",
        "Option 4"
      ],
      "correctAnswer": "Full exact correct option text",
      "idealAnswer": "",
      "explanation": "Why this answer is correct",
      "difficulty": "easy",
      "sourceTimestamp": 0
    }
  ]
}

The sourceTimestamp must be an estimated number of seconds.
Use 0 when the timestamp cannot be determined.

Transcript:

${cleanTranscript}
`,
  });

  const rawQuestions = Array.isArray(
    result
  )
    ? result
    : result?.questions;

  if (!Array.isArray(rawQuestions)) {
    throw new AppError(
      "LLM ne questions array return nahi ki",
      502
    );
  }

  const uniqueQuestions = new Map();

  for (const rawQuestion of rawQuestions) {
    const question = normalizeQuestion(
      rawQuestion,
      normalizedTypes
    );

    if (!question) {
      continue;
    }

    const duplicateKey = question.question
      .toLowerCase()
      .replace(/[^a-z0-9\u0900-\u097f]/gi, "")
      .slice(0, 150);

    if (!uniqueQuestions.has(duplicateKey)) {
      uniqueQuestions.set(
        duplicateKey,
        question
      );
    }
  }

  const questions = [
    ...uniqueQuestions.values(),
  ].slice(0, questionCount);

  if (questions.length === 0) {
    throw new AppError(
      "LLM se koi valid question generate nahi hua",
      502
    );
  }

  /*
   * Exact count na mile to transparent error.
   * Isse incomplete test database me save nahi hoga.
   */
  if (questions.length < questionCount) {
    throw new AppError(
      `LLM ne ${questionCount} me se sirf ${questions.length} valid questions generate kiye. Dobara try karo.`,
      502
    );
  }

  return questions;
}

/**
 * Written-answer grading input ko normalize karta hai.
 */
function normalizeGradingItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .filter(
      (item) =>
        item &&
        item.questionId &&
        item.question
    )
    .map((item) => ({
      questionId: String(
        item.questionId
      ),

      question: String(
        item.question || ""
      ).trim(),

      idealAnswer: String(
        item.idealAnswer || ""
      ).trim(),

      studentAnswer: String(
        item.studentAnswer || ""
      ).trim(),
    }));
}

/**
 * Written answers ko LLM se grade karta hai.
 */
export async function gradeWrittenAnswers(
  items
) {
  const normalizedItems =
    normalizeGradingItems(items);

  if (normalizedItems.length === 0) {
    return [];
  }

  /*
   * Empty answers ko OpenAI par bhejne ki
   * zarurat nahi hai.
   */
  const emptyAnswerGrades =
    normalizedItems
      .filter(
        (item) => !item.studentAnswer
      )
      .map((item) => ({
        questionId: item.questionId,
        score: 0,
        isCorrect: false,
        confidence: 1,
        feedback:
          "Student ne answer submit nahi kiya.",
      }));

  const itemsForAI =
    normalizedItems.filter(
      (item) => item.studentAnswer
    );

  if (itemsForAI.length === 0) {
    return emptyAnswerGrades;
  }

  const result = await createJsonResponse({
    maximumOutputTokens: Math.min(
      12000,
      itemsForAI.length * 700
    ),

    instructions: `
You are a fair educational answer grader.

Grade each student answer using only:
- the question,
- the ideal answer,
- the meaning expressed by the student.

Important rules:
1. Do not penalize harmless grammar or spelling mistakes.
2. Focus on conceptual correctness.
3. Do not reward unrelated information.
4. Score must be between 0 and 1.
5. Confidence must be between 0 and 1.
6. isCorrect should normally be true when score is at least 0.7.
7. Return only valid JSON.
8. Do not return markdown.
`,

    input: `
Grade these student answers:

${JSON.stringify(itemsForAI, null, 2)}

Return this exact JSON structure:

{
  "grades": [
    {
      "questionId": "Same question ID",
      "score": 0.8,
      "isCorrect": true,
      "confidence": 0.9,
      "feedback": "Short useful feedback"
    }
  ]
}
`,
  });

  const rawGrades = Array.isArray(result)
    ? result
    : result?.grades;

  if (!Array.isArray(rawGrades)) {
    throw new AppError(
      "LLM grading response invalid hai",
      502
    );
  }

  const validQuestionIds = new Set(
    itemsForAI.map(
      (item) => item.questionId
    )
  );

  const gradeMap = new Map();

  for (const rawGrade of rawGrades) {
    const questionId = String(
      rawGrade?.questionId || ""
    );

    if (
      !validQuestionIds.has(questionId)
    ) {
      continue;
    }

    const score = Math.max(
      0,
      Math.min(
        1,
        Number(rawGrade.score) || 0
      )
    );

    const confidence = Math.max(
      0,
      Math.min(
        1,
        Number(rawGrade.confidence) || 0
      )
    );

    /*
     * Model ke isCorrect aur numerical score me
     * conflict ho to score ko final rule maana jayega.
     */
    const isCorrect = score >= 0.7;

    gradeMap.set(questionId, {
      questionId,
      score: Number(score.toFixed(2)),
      isCorrect,
      confidence: Number(
        confidence.toFixed(2)
      ),

      feedback:
        typeof rawGrade.feedback ===
        "string"
          ? rawGrade.feedback.trim()
          : "",
    });
  }

  /*
   * LLM ne kisi answer ki grading miss kar di
   * to use manual-review state me bhejenge.
   */
  const aiGrades = itemsForAI.map(
    (item) => {
      const grade = gradeMap.get(
        item.questionId
      );

      if (grade) {
        return grade;
      }

      return {
        questionId: item.questionId,
        score: 0,
        isCorrect: false,
        confidence: 0,
        feedback:
          "AI is answer ko grade nahi kar paya. Admin review required hai.",
      };
    }
  );

  return [
    ...emptyAnswerGrades,
    ...aiGrades,
  ];
}

/**
 * Check karta hai ki OpenAI integration configured hai.
 */
export function isLLMConfigured() {
  if (isGroqProvider()) {
    return Boolean(getApiKey());
  }

  return Boolean(
    getApiKey() &&
      process.env.OPENAI_TEXT_MODEL &&
      process.env.OPENAI_TRANSCRIBE_MODEL
  );
}

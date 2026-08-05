export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);

    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
}

export function sendSuccess(
  response,
  {
    statusCode = 200,
    message = "Success",
    data = null,
  } = {}
) {
  return response.status(statusCode).json({
    success: true,
    message,
    data,
  });
}
export function extractErrorMessage(error: unknown): string {
  if (!error) return "未知错误";
  if (typeof error === "string") return error;

  const value = error as {
    cause?: { Message?: string; message?: string };
    Message?: string;
    message?: string;
  };

  return value.cause?.Message ?? value.cause?.message ?? value.Message ?? value.message ?? String(error);
}

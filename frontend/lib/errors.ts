/**
 * Extract a human-readable message from a thrown error.
 *
 * Action files throw plain `new Error("message")` (its `.message` is a
 * plain string), but some throw `new Error(JSON.stringify(body))`. This
 * handles both cases plus string errors and raw objects.
 */
export function getErrorMessage(err: unknown, fallback = "An unexpected error occurred"): string {
  if (typeof err === "string") {
    const parsed = tryJsonParse(err);
    return extractMessage(parsed) || err || fallback;
  }

  if (err instanceof Error) {
    const parsed = tryJsonParse(err.message);
    return extractMessage(parsed) || err.message || fallback;
  }

  const parsed = tryJsonParse(err);
  return extractMessage(parsed) || fallback;
}

function extractMessage(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const obj = data as Record<string, unknown>;
  if (typeof obj.detail === "string") return obj.detail;
  if (typeof obj.error === "string") return obj.error;
  if (typeof obj.message === "string") return obj.message;
  return "";
}

function tryJsonParse(value: unknown): unknown {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}
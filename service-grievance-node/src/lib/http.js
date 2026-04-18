export class HttpError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

export const success = (data) => ({
  success: true,
  data,
  error: null,
});

export const roundTo = (value, precision = 2) => {
  const factor = 10 ** precision;
  return Math.round((value + Number.EPSILON) * factor) / factor;
};

export const calculateMedian = (values) => {
  if (!Array.isArray(values) || values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }

  return sorted[mid];
};

const dedupeTags = (tags) => {
  const seen = new Set();
  const unique = [];

  for (const tag of tags) {
    const key = tag.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(tag);
    }
  }

  return unique;
};

export const parseTagsInput = (rawTags) => {
  if (rawTags === undefined || rawTags === null) {
    return [];
  }

  if (Array.isArray(rawTags)) {
    const parsed = rawTags
      .map((tag) => String(tag).trim())
      .filter((tag) => tag.length > 0);
    return dedupeTags(parsed);
  }

  if (typeof rawTags === "string") {
    const parsed = rawTags
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    return dedupeTags(parsed);
  }

  throw new HttpError(
    400,
    "Invalid tags format. Use an array of strings or a comma-separated string."
  );
};

export const normalizeTagsOutput = (rawTags) => {
  if (Array.isArray(rawTags)) {
    return parseTagsInput(rawTags);
  }

  if (typeof rawTags === "string") {
    return parseTagsInput(rawTags);
  }

  return [];
};

export const parseBoundedInt = (
  rawValue,
  fallback,
  { min = 0, max = Number.MAX_SAFE_INTEGER } = {}
) => {
  const parsed = Number(rawValue);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  const integerValue = Math.floor(parsed);

  if (integerValue < min) {
    return min;
  }

  if (integerValue > max) {
    return max;
  }

  return integerValue;
};

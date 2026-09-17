/**
 * Recursive Firestore sanitizer:
 * Removes undefined properties, converts undefined in arrays to null,
 * ensures Date objects are converted or valid, and prevents Firestore unsupported type errors.
 */
export const sanitizeForFirestore = (obj) => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj
      .map((item) => sanitizeForFirestore(item))
      .filter((item) => item !== undefined);
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      const sanitized = sanitizeForFirestore(value);
      if (sanitized !== undefined) {
        clean[key] = sanitized;
      }
    }
  }
  return clean;
};

/**
 * Recursive Firestore sanitizer:
 * Removes undefined properties, converts undefined in arrays to null,
 * converts nested arrays (which Firestore forbids) into { cells: [...] } objects,
 * ensures Date objects are converted or valid, and prevents Firestore unsupported type errors.
 */
export const sanitizeForFirestore = (obj, insideArray = false) => {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    const mapped = obj
      .map((item) => sanitizeForFirestore(item, true))
      .filter((item) => item !== undefined);
    if (insideArray) {
      return { cells: mapped };
    }
    return mapped;
  }
  const clean = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      const sanitized = sanitizeForFirestore(value, false);
      if (sanitized !== undefined) {
        clean[key] = sanitized;
      }
    }
  }
  return clean;
};

// Dimension Tolerance Check Helper
export const isDimOk = (val, target, tol) => {
  if (val === undefined || val === null || val === "") return true;
  const num = parseFloat(val);
  if (isNaN(num)) return true;
  if (tol >= 90) return num >= target; // for pulling force
  return num >= target - tol && num <= target + tol;
};

/**
 * 치수 공차 실시간 판정 헬퍼
 * @param {string|number} val 측정값
 * @param {number} target 목표값
 * @param {number} tol 허용공차(±)
 * @returns {boolean}
 */
export const isDimOk = (val, target, tol) => {
  if (val === undefined || val === null || val === "") return true;
  const num = parseFloat(val);
  if (isNaN(num)) return true;
  return num >= (target - tol) && num <= (target + tol);
};

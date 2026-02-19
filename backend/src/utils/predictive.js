const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const predictPerformanceScore = ({ taskCompletionRate, attendanceRate, leaveUtilizationRate }) => {
  const score =
    taskCompletionRate * 0.5 + attendanceRate * 0.35 + (100 - leaveUtilizationRate) * 0.15;
  return Math.round(clamp(score, 0, 100));
};

const detectBurnoutRisk = ({ overtimeHours, attendanceVariance, leaveUtilizationRate }) => {
  const raw = overtimeHours * 0.45 + attendanceVariance * 0.3 + leaveUtilizationRate * 0.25;
  if (raw >= 70) return "high";
  if (raw >= 40) return "medium";
  return "low";
};

module.exports = {
  predictPerformanceScore,
  detectBurnoutRisk
};

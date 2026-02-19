const statusColorMap = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
  present: "success",
  "half-day": "warning",
  "on-leave": "neutral",
  done: "success",
  "in-progress": "info",
  blocked: "danger",
  todo: "neutral",
  active: "success",
  planning: "info",
  "on-hold": "warning",
  completed: "success"
};

const StatusBadge = ({ status }) => {
  const tone = statusColorMap[status] || "neutral";
  return <span className={`status-badge ${tone}`}>{status || "n/a"}</span>;
};

export default StatusBadge;

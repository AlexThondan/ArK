export const formatDate = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
};

export const formatDateTime = (value) => {
  if (!value) return "-";
  return new Date(value).toLocaleString();
};

export const formatDuration = (minutes) => {
  if (!minutes && minutes !== 0) return "-";
  const hrs = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${hrs}h ${mins}m`;
};

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(Number(value || 0));

export const resolveFileUrl = (fileUrl) => {
  if (!fileUrl) return "";
  if (fileUrl.startsWith("http")) return fileUrl;
  const base = (import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");
  return `${base}${fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`}`;
};

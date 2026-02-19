const startOfUtcDay = (date = new Date()) =>
  new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));

const diffInMinutes = (fromDate, toDate) => Math.max(Math.floor((toDate - fromDate) / 60000), 0);

const calculateLeaveDays = (startDate, endDate) => {
  const oneDay = 24 * 60 * 60 * 1000;
  const utcStart = startOfUtcDay(startDate);
  const utcEnd = startOfUtcDay(endDate);
  return Math.floor((utcEnd - utcStart) / oneDay) + 1;
};

module.exports = {
  startOfUtcDay,
  diffInMinutes,
  calculateLeaveDays
};

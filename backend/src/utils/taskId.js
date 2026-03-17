const Task = require("../models/Task");
const Sequence = require("../models/Sequence");

const TASK_ID_SEQUENCE_KEY = "task-id";

const formatTaskId = (value) => `ARK-${String(value).padStart(3, "0")}`;

const parseNumericTaskId = (value) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase();
  if (!normalized) return 0;
  if (/^ARK-\d+$/.test(normalized)) {
    return Number(normalized.split("-")[1] || 0);
  }
  if (/^\d+$/.test(normalized)) {
    return Number(normalized);
  }
  return 0;
};

const getMaxNumericTaskId = async () => {
  const rows = await Task.find({ taskCode: { $exists: true, $ne: null } }).select("taskCode").lean();
  return rows.reduce((maxValue, row) => Math.max(maxValue, parseNumericTaskId(row.taskCode)), 0);
};

const reserveTaskSequence = async (count = 1) => {
  const safeCount = Math.max(1, Number(count) || 1);
  const counter = await Sequence.findOneAndUpdate(
    { key: TASK_ID_SEQUENCE_KEY },
    { $inc: { value: safeCount } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  let endValue = Number(counter?.value || safeCount);
  let startValue = endValue - safeCount + 1;

  if (startValue <= 1) {
    const maxExisting = await getMaxNumericTaskId();
    if (maxExisting >= endValue) {
      const alignedEnd = maxExisting + safeCount;
      await Sequence.findOneAndUpdate(
        { key: TASK_ID_SEQUENCE_KEY },
        { $set: { value: alignedEnd } },
        { new: true }
      );
      endValue = alignedEnd;
      startValue = endValue - safeCount + 1;
    }
  }

  return { startValue, endValue };
};

const generateTaskIds = async (count = 1) => {
  const safeCount = Math.max(1, Number(count) || 1);
  const { startValue } = await reserveTaskSequence(safeCount);
  return Array.from({ length: safeCount }, (_, index) => formatTaskId(startValue + index));
};

const generateTaskId = async () => {
  const values = await generateTaskIds(1);
  return values[0];
};

module.exports = {
  generateTaskId,
  generateTaskIds
};

const Employee = require("../models/Employee");
const Sequence = require("../models/Sequence");

const EMPLOYEE_ID_SEQUENCE_KEY = "employee-id";

const formatEmployeeId = (value) => `ARK-${String(value).padStart(3, "0")}`;

const getMaxNumericEmployeeId = async () => {
  const rows = await Employee.aggregate([
    { $match: { employeeId: { $regex: /^ARK-\d+$/ } } },
    {
      $project: {
        numericId: {
          $toInt: {
            $arrayElemAt: [{ $split: ["$employeeId", "-"] }, 1]
          }
        }
      }
    },
    { $group: { _id: null, maxId: { $max: "$numericId" } } }
  ]);

  return Number(rows?.[0]?.maxId || 0);
};

const generateEmployeeId = async () => {
  const counter = await Sequence.findOneAndUpdate(
    { key: EMPLOYEE_ID_SEQUENCE_KEY },
    { $inc: { value: 1 } },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  let currentValue = Number(counter?.value || 1);

  if (currentValue === 1) {
    const maxExisting = await getMaxNumericEmployeeId();
    if (maxExisting >= currentValue) {
      const aligned = await Sequence.findOneAndUpdate(
        { key: EMPLOYEE_ID_SEQUENCE_KEY },
        { $set: { value: maxExisting + 1 } },
        { new: true }
      );
      currentValue = Number(aligned?.value || maxExisting + 1);
    }
  }

  for (let attempt = 0; attempt < 15; attempt += 1) {
    const candidate = formatEmployeeId(currentValue + attempt);
    // eslint-disable-next-line no-await-in-loop
    const exists = await Employee.exists({ employeeId: candidate });
    if (!exists) {
      if (attempt > 0) {
        await Sequence.findOneAndUpdate(
          { key: EMPLOYEE_ID_SEQUENCE_KEY },
          { $set: { value: currentValue + attempt } },
          { new: true }
        );
      }
      return candidate;
    }
  }

  throw new Error("Failed to generate employee ID");
};

module.exports = {
  generateEmployeeId
};

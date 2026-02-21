const path = require("path");
const fs = require("fs");
const multer = require("multer");
const ApiError = require("../utils/ApiError");
const uploadDir = path.resolve(__dirname, "../../uploads");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ];

  if (!allowed.includes(file.mimetype)) {
    cb(new ApiError(400, "Unsupported file format"), false);
    return;
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024
  },
  fileFilter
});

module.exports = { upload };

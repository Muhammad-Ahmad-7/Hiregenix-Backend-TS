import multer from "multer";
import fs from "fs";
import path from "path";

// Always resolve uploads folder from project root
const uploadDir = path.join(process.cwd(), "uploads");

// Make sure folder exists at runtime (auto-create if missing)
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const fileFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
    const allowedMimes = [
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "audio/mpeg",
        "audio/wav",
        "video/mp4",
        "video/mpeg",
        "video/webm",
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type!"));
    }
};

// 10 MB size limit
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

export default upload;

import { Router } from "express";
import multer from "multer";
import { uploadResume } from "../controllers/resume.controller";

const router = Router();
const upload = multer({ dest: "uploads/" }); // temp storage

router.post("/resume", upload.single("file"), uploadResume);

export default router;

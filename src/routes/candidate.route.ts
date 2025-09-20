import express from "express";
import { resumeParser } from "../controllers/candidate.controller.js";

const candidateRouter = express.Router();


candidateRouter.post("/resume", resumeParser);


export default candidateRouter;


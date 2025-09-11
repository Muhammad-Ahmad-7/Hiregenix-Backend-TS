import express from 'express';
import { login } from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const authRouter = express.Router();


authRouter.post('/login', asyncHandler(login));

export default authRouter;

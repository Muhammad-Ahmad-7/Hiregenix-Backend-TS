import express from 'express';
import { login, signup } from '../controllers/auth.controller.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { signupSchema } from '../validators/user.validator.js';

const authRouter = express.Router();


authRouter.post('/login', login);
authRouter.post('/signup', validateRequest(signupSchema), signup);

export default authRouter;

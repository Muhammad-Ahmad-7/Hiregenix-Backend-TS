import express from 'express';
import { googleAuth, login, signup, verifyEmail } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { loginSchema, signupSchema } from '../validators/user.validator.js';

const authRouter = express.Router();


authRouter.post('/login', validateRequest(loginSchema), login);
authRouter.post('/signup', validateRequest(signupSchema), signup);
authRouter.post('/verify-email/:token', verifyEmail);
authRouter.get('/google', googleAuth);

export default authRouter;

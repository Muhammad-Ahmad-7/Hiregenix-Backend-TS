import { z } from "zod";

export const CreateInterviewQuestionResultSchema = z.object({
    interviewId: z.string(),
    questionId: z.string(),
    questionText: z.string().min(1),
})
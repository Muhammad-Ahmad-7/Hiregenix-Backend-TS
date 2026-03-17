import { z } from "zod";

export const CreateInterviewQuestionResultSchema = z.object({
    interviewId: z.string(),
    questionId: z.string(),
    questionText: z.string().min(1),
    numberOfTabSwitch: z.number().min(0),

})
export const createInterviewQuestionResultForSkipQuestionsSchema = z.object({
    interviewId: z.string(),
    questionId: z.string(),
    questionText: z.string().min(1),
})
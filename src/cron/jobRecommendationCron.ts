import cron from "node-cron";
import CandidateModel from "../models/candidate.model.js";
import { TaskModel } from "../models/task.model.js";
import { sendToQueue } from "../config/rabbitmq.js";
import { JOB_RECOMMENDATION_QUEUE, TIMEZONE } from "../utils/constant.js";

const jobRecommendationJob = (): void => {
    cron.schedule("0 0 * * *", async (): Promise<void> => {
        console.log(`[CRON] Running job recommendation job (UTC): ${new Date().toISOString()}`);

        try {
            const candidates = await CandidateModel.find({}).select("_id").lean();

            console.log(`[CRON] Found candidates for recommendation: ${candidates.length}`);

            for (const candidate of candidates) {
                const candidateId = candidate._id;

                const task = await TaskModel.create({
                    userId: candidateId,
                    type: "job_recommendation",
                    status: "pending",
                    payload: {
                        candidateId,
                    },
                });

                sendToQueue(JOB_RECOMMENDATION_QUEUE, task._id.toString());
            }

            console.log(`[CRON] Job recommendation job completed at ${new Date().toISOString()}`);
        } catch (error) {
            console.error("[CRON] Job recommendation job failed:", error);
        }
    }, { timezone: TIMEZONE });
};

export default jobRecommendationJob;

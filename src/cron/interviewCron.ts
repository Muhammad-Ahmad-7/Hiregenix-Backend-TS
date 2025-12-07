import cron from "node-cron";
import { InterviewModel, IInterview } from "../models/interview.model.js";
import { EmailService } from "../services/email.service.js";

const interviewReminderJob = (): void => {
    // Runs every day at midnight (server local time)
    cron.schedule("0 0 * * *", async (): Promise<void> => {
        console.log(`[CRON] Running interview reminder job (UTC): ${new Date().toISOString()}`);

        // Get tomorrow's date range
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(now.getDate() + 1);

        const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
        const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999);

        // Fetch interviews scheduled for tomorrow
        const interviews: IInterview[] = await InterviewModel.find({
            scheduledDate: { $gte: startOfTomorrow, $lte: endOfTomorrow }
        })
            .populate("companyId")
            .populate("jobId")
            .populate({
                path: "candidateId",
                populate: {
                    path: "userId",
                    select: "email name"
                }
            })
            .exec(); // ensures proper promise typing

        console.log(`[CRON] Found interviews: ${interviews.length}`);
        console.log(`[CRON] Found interviews: ${interviews}`);

        // Verify email service
        const isEmailServiceWorking = await EmailService.verifyConnection();
        if (!isEmailServiceWorking) {
            console.error("Email Service not working. Aborting job.");
            return;
        }

        // Loop through each interview and send email
        for (const interview of interviews) {
            try {
                const candidateUser = (interview.candidateId as any)?.userId;
                const company = (interview.companyId as any)
                const candidateEmail = candidateUser?.email;
                const candidateName = candidateUser?.fullName || "Candidate";
                const companyName = company.companyName || "Company";
                const jobTitle = (interview.jobId as { title?: string })?.title || "your job";
                const interviewGuideline =
                    (interview.jobId as { interviewGuideline?: string })?.interviewGuideline ||
                    `Please be prepared for the interview scheduled on ${interview?.scheduledDate?.toDateString()}. Arrive on time and be ready.`;

                if (!candidateEmail) {
                    console.warn(`Skipping interview ${interview._id} - candidate email not found`);
                    continue;
                }

                await EmailService.sendInterviewReminderEmail(
                    candidateEmail,
                    candidateName,
                    jobTitle,
                    companyName,
                    interviewGuideline
                );

                console.log(`Interview reminder sent to ${candidateEmail} for ${jobTitle}`);
            } catch (error) {
                console.error(`Failed to send email for interview ${interview._id}:`, error);
            }
        }

        console.log(`[CRON] Interview reminder job completed at ${new Date().toISOString()}`);
    });
};

export default interviewReminderJob;

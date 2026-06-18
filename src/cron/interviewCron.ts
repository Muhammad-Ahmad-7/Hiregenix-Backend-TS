import cron from "node-cron";
import { DateTime } from "luxon";
import { InterviewModel, IInterview } from "../models/interview.model.js";
import { EmailService } from "../services/email.service.js";
import { TIMEZONE } from "../utils/constant.js";

const interviewReminderJob = (): void => {
    // Runs every day at midnight in the configured timezone.
    cron.schedule("0 0 * * *", async (): Promise<void> => {
        console.log(`[CRON] Running interview reminder job (UTC): ${new Date().toISOString()}`);

        const startOfTomorrow = DateTime.now()
            .setZone(TIMEZONE)
            .plus({ days: 1 })
            .startOf("day");

        const endOfTomorrow = startOfTomorrow.endOf("day");
        const startOfTomorrowUtc = startOfTomorrow.toUTC().toJSDate();
        const endOfTomorrowUtc = endOfTomorrow.toUTC().toJSDate();

        console.log(
            `[CRON] Interview reminder query range (${TIMEZONE}): ${startOfTomorrow.toISO()} to ${endOfTomorrow.toISO()} | UTC: ${startOfTomorrowUtc.toISOString()} to ${endOfTomorrowUtc.toISOString()}`
        );

        // Fetch interviews scheduled for tomorrow
        const interviews: IInterview[] = await InterviewModel.find({
            scheduledDate: { $gte: startOfTomorrowUtc, $lte: endOfTomorrowUtc },
            status: "scheduled",
        })
            .populate("companyId", "companyName")
            .populate({
                path: "jobId",
                select: "title role experienceLevel"
            })
            .populate({
                path: "candidateId",
                populate: {
                    path: "userId",
                    select: "email"
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
                const candidateUser = (interview.candidateId as any);
                const candidateEmail = candidateUser?.userId?.email;
                const candidateName = candidateUser?.fullName || "Candidate";
                const candidatePhone = candidateUser?.contactNumber || "N/A";

                const company = (interview.companyId as any)
                const companyName = company.companyName || "Company";

                const job = (interview.jobId as any);
                const jobTitle = job.title || "Job Title";
                const jobRole = job.role || "Job Role";
                const jobExperienceLevel = job.experienceLevel || "Experience Level";

                if (!candidateEmail) {
                    console.warn(`Skipping interview ${interview._id} - candidate email not found`);
                    continue;
                }

                await EmailService.sendInterviewReminderEmail(
                    candidateEmail,
                    candidateName,
                    candidatePhone,
                    jobRole,
                    jobExperienceLevel,
                    jobTitle,
                    companyName,
                );

                console.log(`Interview reminder sent to ${candidateEmail} for ${jobTitle}`);
            } catch (error) {
                console.error(`Failed to send email for interview ${interview._id}:`, error);
            }
        }

        console.log(`[CRON] Interview reminder job completed at ${new Date().toISOString()}`);
    }, { timezone: TIMEZONE });
};

export default interviewReminderJob;

import cron from 'node-cron';
import { JobModel } from '../models/job.model.js';

const jobDeadlinePassedJob = (): void => {
    // Runs every hour (server local time)
    cron.schedule('0 * * * *', async (): Promise<void> => {
        console.log(`[CRON] Running job deadline passed job (UTC): ${new Date().toISOString()}`);

        try {
            // Inside your cron function
            const result = await JobModel.updateMany(
                {
                    deadline: { $lt: new Date() }, // Use $lt (less than) to catch everything before now
                    status: 'open',
                    isDeleted: false // Always a good safety check
                },
                {
                    $set: { status: 'closed' }
                }
            );

            console.log(`✅ Cron Success: ${result.modifiedCount} jobs were closed.`);
        } catch (error) {
            console.error(`❌ Cron Error: ${error}`);
        } finally {
            console.log(`[CRON] Job deadline passed job completed at ${new Date().toISOString()}`);
        }
    });
};

export default jobDeadlinePassedJob;
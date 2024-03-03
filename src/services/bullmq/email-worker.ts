import { Worker, Job } from "bullmq";
import { transporter } from "../../config/mail-server";
import { EMAIL_FROM, NODE_ENV } from "../../constant/env";
import { IEMAIL } from "../../@types";
import redisClient from "../../config/redisClient";
import { EMAIL_QUEUE } from "../../constant";
import logger from "../../logger/winston.logger";

export const startBullMqWorker = async () => {
  try {
    // Process email jobs
    const worker = new Worker(
      EMAIL_QUEUE,
      async (job: Job) => {
        // Extract email details from the job data
        const { to, subject, text, html } = job.data as IEMAIL;
        try {
          // Send the email using Nodemailer
          await sendEmail({ to, subject, text, html });
          logger.info("Email sent successfully:", job.id);
        } catch (error) {
          logger.error("Error sending email:", error);
          // Retry the job if it fails
          throw new Error(error as any);
        }
      },
      { connection: redisClient, concurrency: 2 }
    );

    worker.on("completed", (job: Job) => {
      console.log(`Worker completed job ${job.id}`);
    });
    worker.on("ready", () => {
      logger.info("BullmQ Worker is now ready to start !");
    });
    worker.on("failed", (job, error) => {
      logger.error(`Worker failed job ${(job as any).id}: ${error}`);
    });
  } catch (error) {
    logger.error(error);
  }
};

async function sendEmail(emailOptions: IEMAIL) {
  // Define email options
  const mailOptions = {
    from: String(EMAIL_FROM),
    ...emailOptions,
  };
  // Send the email
  try {
    if (NODE_ENV == "development") {
      logger.info("Email sent successfully to :", mailOptions.to);
    }
    const info = await transporter.sendMail(mailOptions);
    logger.info("Email sent successfully:", info);
  } catch (error) {
    logger.info(error);
  }
}

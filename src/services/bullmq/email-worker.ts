import { Worker, Job } from "bullmq";
import { transporter } from "../../config/mail-server";
import { EMAIL_FROM } from "../../constant/env";
import { IEMAIL } from "../../@types";
import redisClient from "../../config/redisClient";
import { EMAIL_QUEUE } from "../../constant";

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
          console.log("Email sent successfully:", job.id);
        } catch (error) {
          console.error("Error sending email:", error);
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
      console.log("BullmQ Worker is now ready to start !");
    });
    worker.on("failed", (job, error) => {
      console.error(`Worker failed job ${(job as any).id}: ${error}`);
    });
  } catch (error) {
    console.log(error);
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
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.log(error);
  }
}

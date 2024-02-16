import { Queue } from "bullmq";
import { IEMAIL } from "../../@types";
import redisClient from "../../config/redisClient";
import { EMAIL_QUEUE } from "../../constant";

export const emailQueue = new Queue(EMAIL_QUEUE, {
  connection: redisClient,
});

// Function to enqueue an email job
export async function enqueueEmail(emailOptions: IEMAIL) {
  await emailQueue.add("send-email", { ...emailOptions }, { attempts: 3 });
}

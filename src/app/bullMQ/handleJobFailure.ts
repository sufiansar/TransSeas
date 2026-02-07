import { Job } from "bullmq";
import { mailWorker } from "./workers/mailWorkers";
import { messagePersistenceWorker } from "./workers/messagePersistenceWorkers";


function handleJobFailure(job: Job | undefined, err: Error) {
  if (!job) return;
  
  console.error(`❌ Job ${job.id} (${job.name}) failed:`, err.message);

  try {
    // optional: keep failed jobs for debugging instead of removing
    job.remove().catch((removeErr) => {
      console.error(`⚠️ Failed to remove job ${job.id}:`, removeErr);
    });
  } catch (removeErr) {
    console.error(`⚠️ Failed to remove job ${job.id}:`, removeErr);
  }
}

// Attach to workers

mailWorker.on("failed", handleJobFailure);
messagePersistenceWorker.on("failed", handleJobFailure);

export default handleJobFailure;

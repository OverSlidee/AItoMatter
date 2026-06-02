import { Queue } from "bullmq";

export const redisConnectionOptions = {
  host: "127.0.0.1",
  port: 6379,
};

export const engineeringQueue = new Queue("engineering-jobs", {
  connection: redisConnectionOptions,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  }
});

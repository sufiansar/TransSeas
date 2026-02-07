

// export async function cleanQueues() {
//     await Promise.all([
//         otpQueueEmail.clean(0, 1000, "completed"),
//         otpQueueEmail.clean(0, 1000, "failed"),
//         otpQueueEmail.clean(0, 1000, "delayed"),
//         otpQueueEmail.clean(0, 1000, "wait"),

//         requestQueueEmail.clean(0, 1000, "completed"),
//         requestQueueEmail.clean(0, 1000, "failed"),
//         requestQueueEmail.clean(0, 1000, "delayed"),
//         requestQueueEmail.clean(0, 1000, "wait"),

//         // conversationListQueue.clean(0, 1000, "completed"),
//         // conversationListQueue.clean(0, 1000, "failed"),
//         // conversationListQueue.clean(0, 1000, "delayed"),
//         // conversationListQueue.clean(0, 1000, "wait"),

//         // assignJobQueue.clean(0, 1000, "completed"),
//         // assignJobQueue.clean(0, 1000, "failed"),
//         // assignJobQueue.clean(0, 1000, "delayed"),
//         // assignJobQueue.clean(0, 1000, "wait"),

//         // messagePersistenceQueue.clean(0, 1000, "completed"),
//         // messagePersistenceQueue.clean(0, 1000, "failed"),
//         // messagePersistenceQueue.clean(0, 1000, "delayed"),
//         // messagePersistenceQueue.clean(0, 1000, "wait"),
//     ]);
// }


// cleanQueues().catch((err) => console.error("❌ Error cleaning queues:", err));
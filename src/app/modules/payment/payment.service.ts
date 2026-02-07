// import Stripe from "stripe";
// import { PAYMENT_STATUS, Prisma } from "../../../generated/prisma";
// import { prisma } from "../../config/prisma";
// import { stripe } from "../../config/stripe.config";
// import dbConfig from "../../config/db.config";

// const handleWebhook = async (signature: string, body: Buffer) => {
//   let event: Stripe.Event;

//   try {
//     event = stripe.webhooks.constructEvent(
//       body,
//       signature,
//       dbConfig.stripe.stripe_webhook_secret as string
//     );
//   } catch (err: any) {
//     console.error("❌ Stripe webhook signature failed:", err.message);
//     return { message: "Invalid webhook signature" };
//   }

//   // ✅ Stripe Checkout success (Payment Links + Checkout)
//   if (event.type === "checkout.session.completed") {
//     const session = event.data.object as Stripe.Checkout.Session;

//     const { appointmentId, transactionId, paymentId } =
//       session.metadata || {};

//     if (!appointmentId || !transactionId || !paymentId) {
//       console.error("⚠️ Missing Stripe metadata:", session.metadata)
//       return { message: "Webhook received but metadata missing" };
//     }

//     console.log("✅ Payment confirmed for appointment:", appointmentId);

//     try {
//       await prisma.$transaction(async (tx) => {
//         await tx.appointment.update({
//           where: { id: appointmentId },
//           data: { paymentStatus: PAYMENT_STATUS.PAID },
//         });

//         await tx.payment.update({
//           where: { id: paymentId },
//           data: {
//             status: PAYMENT_STATUS.PAID,
//             paymentGatewayData: session as Prisma.InputJsonValue,
//           },
//         });
//       });
//     } catch (dbErr) {
//       console.error("❌ DB update failed:", dbErr);
//       // Don't throw — Stripe would retry forever
//       return { message: "DB error but webhook received" };
//     }

//     return { message: "Payment processed successfully", appointmentId };
//   }

//   // Optional: log other events while testing
//   console.log("ℹ️ Ignored Stripe event:", event.type);

//   return { message: `Ignored event ${event.type}` };
// };

// export const PaymentService = {
//   handleWebhook,
// };

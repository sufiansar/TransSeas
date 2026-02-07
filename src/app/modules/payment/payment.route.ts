// import express from "express";
// import bodyParser from "body-parser";
// import { PaymentController } from "./payment.controller";

// const router = express.Router();

// // Stripe webhook requires raw body
// router.post(
//   "/webhook",
//   bodyParser.raw({ type: "application/json" }),
//   PaymentController.handleWebhook
// );

// export const PaymentRoutes = router;
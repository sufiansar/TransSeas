
// import { Request, Response } from "express";
// import { catchAsync } from "../../utility/catchAsync";
// import { sendResponse } from "../../utility/sendResponse";
// import { PaymentService } from "./payment.service";



// const handleWebhook = catchAsync(async (req: Request, res: Response) => {
//   const signature = req.headers["stripe-signature"] as string;

//   if (!signature) {
//     res
//       .status(400)
//       .json({ success: false, message: "Missing Stripe signature" });
//     return;
//   }

//   const result = await PaymentService.handleWebhook(signature, req.body);
//   sendResponse(res, {
//     statusCode: 200,
//     success: true,
//     message: "Webhook processed successfully",
//     data: result,
//   });
// });

// export const PaymentController = {
//   handleWebhook,
// };
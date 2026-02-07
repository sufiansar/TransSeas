import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import router from "./app/routes/router";

import cookieParser from "cookie-parser";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
// import { PaymentController } from "./app/modules/payment/payment.controller";

const app: Application = express();
// app.post(
//   "/webhook",
//   express.raw({ type: "application/json" }),
//   PaymentController.handleWebhook
// );
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  }),
);

//parser
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

app.use("/api/v1", router);

app.get("/", (req: Request, res: Response) => {
  res.send({
    message: "Server is running..",
    environment: process.env.NODE_ENV,
    uptime: process.uptime().toFixed(2) + " sec",
    timeStamp: new Date().toISOString(),
  });
});

app.use(globalErrorHandler);

app.use(notFound);

export default app;

import { Router } from "express";
import { QuotesController } from "./quotes.controller";

const router = Router();

router.post("/", QuotesController.createQuotation);

export const QuotesRoute = router;

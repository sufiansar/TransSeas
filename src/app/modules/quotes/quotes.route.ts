import { Router } from "express";
import { QuotesController } from "./quotes.controller";
import auth from "../../middlewares/checkAuth";

const router = Router();

router.get("/", auth(), QuotesController.getAllQuotations);

router.post("/", QuotesController.createQuotation);

export const QuotesRoute = router;

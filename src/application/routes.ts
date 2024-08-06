import express, {Router} from "express";

import eventRouter from "./event/routes";
import chatbotRouter from "./chatbot/routes";

const router: Router = express.Router();

router.use("/event", eventRouter);
router.use("/chatbot", chatbotRouter);

export default router;

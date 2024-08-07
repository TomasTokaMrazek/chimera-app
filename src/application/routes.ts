import express, {Router} from "express";

import eventRouter from "./event/routes";
import chatbotRouter from "./chatbot/routes";
import agraelusRouter from "./agraelus/routes";

const router: Router = express.Router();

router.use("/event", eventRouter);
router.use("/chatbot", chatbotRouter);
router.use("/agraelus", agraelusRouter);

export default router;

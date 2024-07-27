import express, {Router} from "express";

import eventRouter from "./event/routes";

const router: Router = express.Router();

router.use("/event", eventRouter);

export default router;

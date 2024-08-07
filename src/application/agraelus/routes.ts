import express, {Router} from "express";
import agraelusController from "./controller";

const router: Router = express.Router();

router.post("/connect", agraelusController.connect);
router.post("/disconnect", agraelusController.disconnect);

export default router;

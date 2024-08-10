import express, {Router} from "express";

import chatbotController from "./controller";

const router: Router = express.Router();

router.get("/login", chatbotController.login);
router.get("/oauth/callback", chatbotController.oauthCallback);
router.post("/connect", chatbotController.connect);
router.post("/disconnect", chatbotController.disconnect);

export default router;

import express, {Router} from "express";
import twitchController from "./controller";

const router: Router = express.Router();

router.get("/login", twitchController.login);
router.get("/oauth/callback", twitchController.oauthCallback);
router.post("/connect", twitchController.connect);

export default router;

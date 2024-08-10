import express, {Router} from "express";

import streamLabsController from "./controller";

const router: Router = express.Router();

router.get("/login", streamLabsController.login);
router.get("/oauth/callback", streamLabsController.oauthCallback);
router.post("/connect", streamLabsController.connect);

export default router;

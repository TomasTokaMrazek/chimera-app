import express, {Router} from "express";

import streamElementsController from "./controller";

const router: Router = express.Router();

router.get("/login", streamElementsController.login);
router.post("/connect", streamElementsController.connect);

export default router;

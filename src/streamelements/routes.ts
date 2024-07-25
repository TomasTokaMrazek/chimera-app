import express, {Router} from "express";
import streamElementsController from "./controller";

const router: Router = express.Router();

router.get("/login", streamElementsController.login);

export default router;

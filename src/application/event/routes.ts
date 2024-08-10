import express, {NextFunction, Request, Response, Router} from "express";
import {ZodError, ZodSchema} from "zod";

import controller from "./controller";

import * as Dto from "./dto";

export const validate = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    try {
        req.body = schema.parse(req.body);
        next();
    } catch (error) {
        if (error instanceof ZodError) {
            return res.status(400).json({
                message: "Validation failed.",
                errors: error.errors
            });
        }
        next(error);
    }
};

const router: Router = express.Router();

router.post("/enable", validate(Dto.EventSyncRequest), controller.enable);
router.post("/disable", validate(Dto.EventSyncRequest), controller.disable);
router.get("/get", controller.get);

export default router;

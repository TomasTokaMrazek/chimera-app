import express, {Router} from "express";

import twitchService from "./service";

const router: Router = express.Router();

router.get("/login", async (req, res, next): Promise<void> => {
    try {
        const accountId: string = req.query.accountId as string;

        await twitchService.getTwitchId(accountId);

        res.redirect("/success");
    } catch (error) {
        next(error);
    }
});

export default router;

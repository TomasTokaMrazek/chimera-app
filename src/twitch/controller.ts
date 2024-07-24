import express, {Router} from "express";

import twitchRepository from "./repository";

const router: Router = express.Router();

router.get("/login", async (req, res, next): Promise<void> => {
    try {
        const accountId: string = req.query.accountId as string;

        await twitchRepository.getTwitchId(accountId);

        res.redirect("/success");
    } catch (error) {
        next(error);
    }
});

export default router;

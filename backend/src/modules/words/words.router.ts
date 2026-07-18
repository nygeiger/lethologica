import { Router } from "express";
import { getNextWord, getUserHistory, updateWordProgress } from "./words.controller.js";

const wordsRouter: Router = Router()

//* middleware chain: authenticateJWT
wordsRouter.get("/today", getNextWord)
wordsRouter.patch("/:wordId/review", updateWordProgress)
wordsRouter.get("/history", getUserHistory)

export default wordsRouter;
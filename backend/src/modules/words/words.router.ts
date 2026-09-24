import { Router } from "express";
import { getNextWord, getUserHistory, updateWordProgress, getRandomWords, getWordById } from "./words.controller.js";

const wordsRouter: Router = Router()

//* middleware chain: authenticateJWT
wordsRouter.get("/today", getNextWord)
wordsRouter.get("/random", getRandomWords)
wordsRouter.get("/history", getUserHistory)
wordsRouter.get("/:wordId", getWordById)
wordsRouter.patch("/:wordId/review", updateWordProgress)

export default wordsRouter;
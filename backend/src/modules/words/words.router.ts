import { Router } from "express";
import { getNextWord, getUserHistory, updateWordProgress, getRandomWords } from "./words.controller.js";

const wordsRouter: Router = Router()

//* middleware chain: authenticateJWT
wordsRouter.get("/today", getNextWord)
wordsRouter.get("/random", getRandomWords)
wordsRouter.get("/history", getUserHistory)
wordsRouter.patch("/:wordId/review", updateWordProgress)

export default wordsRouter;
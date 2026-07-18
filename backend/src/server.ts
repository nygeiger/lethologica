import express from "express"
import env from "./config/env.js"
import healthRoute from "./modules/health/health.router.js";
import authRoute from "./modules/auth/auth.routes.js";
import wordsRouter from "./modules/words/words.router.js";
import { authenticateJWT } from "./middleware/authenticate.js";
import listsRouter from "./modules/lists/lists.router.js";
import logger from "./utils/logger.js";

const app = express()
app.use(express.json())
app.use("/api/health", healthRoute)
app.use("/api/auth", authRoute)
app.use("/api/words", authenticateJWT, wordsRouter)
app.use("/api/lists", authenticateJWT, listsRouter)

app.use((err: any, req: express.Request, res: any, next: any) => {
    logger.error("Something went wrong. Please try again later.")
    if (!res.headersSent) { // Check if a response has already been sent
        res.status(500).send({ message: "Something went wrong. Please try again later" })
    }
})

app.listen(env.PORT, () => {
    logger.info(`Now listening on port: ${env.PORT}`)
})
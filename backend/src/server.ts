import express, { type Express } from "express"
import cors from "cors";
import env from "./config/env.js"
import healthRoute from "./modules/health/health.router.js";
import authRoute from "./modules/auth/auth.router.js";
import wordsRouter from "./modules/words/words.router.js";
import { authenticateJWT } from "./middleware/authenticate.js";
import listsRouter from "./modules/lists/lists.router.js";
import logger from "./utils/logger.js";

const app: Express = express()
app.use(express.json())
app.use(cors());
app.use("/api/health", healthRoute)
app.use("/api/auth", authRoute)
app.use("/api/words", authenticateJWT, wordsRouter)
app.use("/api/lists", authenticateJWT, listsRouter)

app.use((err: any, req: express.Request, res: any, next: any) => {
    logger.error(req, "Something went wrong. Please try again later.")
    if (!res.headersSent) { // Check if a response has already been sent
        res.status(500).send({ message: "Something went wrong. Please try again later", req: req })
    }
})

app.listen(env.PORT, () => {
    logger.info(`Now listening on port: ${env.PORT}`)
})

export default app;
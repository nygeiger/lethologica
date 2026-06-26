import express from "express"
import env from "./config/env.js"
import healthRoute from "./modules/health/health.router.js";
import authRoute from "./modules/auth/auth.routes.js";
import wordsRouter from "./modules/words/words.router.js";
import { authenticateJWT } from "./middleware/authenticate.js";
import listsRouter from "./modules/lists/lists.router.js";

const app = express();
app.use(express.json())
app.use("/api/health", healthRoute)
app.use("/api/auth", authRoute)
app.use("/api/words", authenticateJWT, wordsRouter)
app.use("/api/lists", authenticateJWT, listsRouter)

app.listen(env.PORT, () => {
    console.log(`Now listening on port: ${env.PORT}`);
})
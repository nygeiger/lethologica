import express from "express"
import env from "./config/env.js"
import healthRoute from "./modules/health/health.router.js";
import authRoute from "./modules/auth/auth.routes.js";

const app = express();
app.use(express.json())
app.use("/api/health", healthRoute)
app.use("/api/auth", authRoute)

app.listen(env.PORT, () => {
    console.log(`Now listening on port: ${env.PORT}`);
})
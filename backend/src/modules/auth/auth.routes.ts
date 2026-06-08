import { Router } from "express";
import { authLogin, authRegister, getAuthedUser } from "./auth.controller.js";
import { authenticateJWT } from "../../middleware/authenticate.js";

const authRoute: Router = Router()

authRoute.post("/login", authLogin);
authRoute.post("/register", authRegister);
authRoute.get("/me", authenticateJWT, getAuthedUser)

export default authRoute;
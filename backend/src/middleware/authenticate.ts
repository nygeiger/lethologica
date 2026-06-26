import jwt, { type JwtPayload } from "jsonwebtoken"
import { type Request, type Response, type NextFunction } from "express"
import env from "../config/env.js";

export function authenticateJWT(req: Request, res: Response, next: NextFunction) {
    try {
        const authHeader = req.headers.authorization
        if(typeof authHeader !== "string" || !authHeader.startsWith("Bearer")) {
            res.status(401).json({message: "User not authenticated"})
        }
        const token = authHeader!.split(" ")[1]
        const decoded = jwt.verify(token!, env.JWT_SECRET) as JwtPayload & { userId: string };
        req.user = { userId: decoded.userId }
        next();
    } catch (err) {
        res.status(401).json("jwt authentication failed")
    }
}
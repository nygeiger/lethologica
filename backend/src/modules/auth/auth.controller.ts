import z from "zod";
import bcrypt from "bcrypt"
import type { Request, Response } from "express";
import jwt, { type SignOptions } from "jsonwebtoken"
import env from "../../config/env.js";
import { dbGetAuthedUser, dbGetUser, dbInsertUser } from "./auth.services.js";
import logger from "../../utils/logger.js";

const loginBody = z.object({
    email: z.email(),
    pass: z.string()
})

const registerBody = z.object({
    email: z.email(),
    pass: z.string()
})

const signJWT = (userId: string) => {
    return jwt.sign({ userId: userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] || "7d" })
}

export async function authLogin(req: Request, res: Response) {
    try {
        const requestCred = loginBody.parse(req.body)
        const queryResult = await dbGetUser(requestCred.email)
        if (!queryResult.rowCount) {
            logger.warn({ userEmail: requestCred.email }, "Login attempt for non-existent user")
            res.status(404).json({ message: "login failed" })
            return
        }
        const user = queryResult.rows[0]!
        const correctPass = await bcrypt.compare(requestCred.pass, user.password_hash)
        if (!correctPass) {
            res.status(401).json({ message: "login failed" })
            return
        }
        const token = signJWT(user.id)
        res.status(200).json(token)
    }
    catch (err) {
        logger.error({ err, ...req.body.email }, "Error Authenticating User")
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            res.status(500).json(err.code)
            return
        }
        res.status(500).json({ message: "Failed User login" })
    }
}

export async function authRegister(req: Request, res: Response) {
    try {
        const requestCred = registerBody.parse(req.body)
        const queryResult = await dbInsertUser(requestCred.email, await bcrypt.hash(requestCred.pass, 10))
        const newUser = queryResult.rows[0]
        if (!newUser) {
            logger.error({ userEmail: requestCred.email }, "Failed to create new user when registering")
            res.status(500).json({ message: "Registration failed" })
            return
        }
        const token = signJWT(newUser.id)
        res.status(201).json(token)
    } catch (err) {
        logger.error({ err, ...req.body.email }, "Error Registering User")
        if (err instanceof z.ZodError) {
            res.status(400).json(err.message)
            return
        }
        if (err instanceof Error && "code" in err) {
            switch (err.code) {
                case "23505":
                    res.status(409).json({ message: "email is already taken" })
                    break;
                default:
                    res.status(401).json({ message: "user registration failed, Please contact dev team" })
                    break;
            }
            return
        }
        res.status(500).send()

    }
}

export async function getAuthedUser(req: Request, res: Response) {
    try {
        if (!req.user) {
            res.status(401).json("User not found")
            return
        }
        const queryResult = await dbGetAuthedUser(req.user.userId)
        if (!queryResult.rowCount) {
            logger.error({ ...req.user }, "Failed to find authenticated user")
            res.status(401).json({ message: "User not found" })
            return
        }
        res.status(200).json(queryResult.rows[0])
    } catch (err) {
        logger.error(err, "Error authenticating user")
        res.status(401).send({ message: "Error authenticating user" })
    }
}
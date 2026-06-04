import type { Request, Response } from "express";
import { dbHealthCheck } from "../../config/db.js";

export const getHealthCheck = async (_: Request, res: Response) => {
    const dbHealth = await dbHealthCheck()
    res.status(200).json({message: "Health check O.K.", dbHealth});
}
import express, { Router } from "express";
import { getHealthCheck } from "./health.controller.js";


const healthRoute: Router = express.Router()

healthRoute.get("/", getHealthCheck)

export default healthRoute;
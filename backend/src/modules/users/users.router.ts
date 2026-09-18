import { Router } from "express";
import { searchUsers } from "./users.controller.js";

const usersRouter: Router = Router()

/*
 * GET /api/users/search?email=:query&listId=:listId — search for users by email excluding current user and existing shares
 */
usersRouter.get("/search", searchUsers)

export default usersRouter;

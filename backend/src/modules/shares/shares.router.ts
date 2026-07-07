import { Router } from "express";
import { getShares, addShare, updateShare, deleteShare } from "./shares.controller.js";

const sharesRouter: Router = Router({mergeParams: true})
/*
* GET /api/lists/:listId/shares — get current shares for a list (owner only)
* POST /api/lists/:listId/shares — share with a user by email + set role
* PATCH /api/lists/:listId/shares/:shareId — change a user's role
* DELETE /api/lists/:listId/shares/:shareId — revoke access
*/

sharesRouter.get("/", getShares)
sharesRouter.post("/", addShare)
sharesRouter.patch("/:shareId", updateShare)
sharesRouter.delete("/:shareId", deleteShare)

export default sharesRouter;
import { Router } from "express";
import { requirePermission } from "./requireListAccess.js";
import { getAllLists, getList, addWordToList, renameList, deleteList, removeWordFromList, createList } from "./lists.controller.js";
import sharesRouter from "../shares/shares.router.js";

const listsRouter: Router = Router()

//* middleware chain: authenticateJWT
listsRouter.get("/", getAllLists)
listsRouter.get("/:listId", requirePermission("canView"), getList)

listsRouter.post("/", createList)
listsRouter.post("/:listId/words/:wordId", requirePermission("canEdit"), addWordToList)

listsRouter.patch("/:listId", requirePermission("isOwner"), renameList)

listsRouter.delete("/:listId", requirePermission("isOwner"), deleteList)
//?: change this to req.body to enable batch removal?
listsRouter.delete("/:listId/words/:wordId", requirePermission("canEdit"), removeWordFromList)

listsRouter.use("/:listId/shares", requirePermission("isOwner"), sharesRouter)
export default listsRouter;
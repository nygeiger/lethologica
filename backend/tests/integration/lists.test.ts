import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import app from "../../src/server.js"
import { testDbQuery } from "../config/db.js"

type AuthenticatedUser = {
    email: string
    token: string
}

type ListResponse = {
    id: string
    list_name: string
    owner_id: string
    created_at: string
    modified_at: string
    can_edit: boolean
}

let emailCounter = 0
let listCounter = 0

const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${emailCounter++}@example.com`
const uniqueListName = (prefix: string) => `${prefix}-${Date.now()}-${listCounter++}`

const registerUser = async (prefix: string): Promise<AuthenticatedUser> => {
    const email = uniqueEmail(prefix)
    const response = await request(app).post("/api/auth/register").send({
        email,
        pass: "password123"
    })
    expect(response.status).toBe(201)
    expect(typeof response.body).toBe("string")
    return { email, token: response.body }
}

const createList = async (token: string, prefix = "list"): Promise<ListResponse> => {
    const listName = uniqueListName(prefix)
    const createResponse = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({ listName })

    expect(createResponse.status).toBe(201)

    const listsResponse = await request(app)
        .get("/api/lists")
        .set("Authorization", `Bearer ${token}`)

    expect(listsResponse.status).toBe(200)
    const list = listsResponse.body.find((candidate: ListResponse) => candidate.list_name === listName)
    expect(list).toBeDefined()
    return list as ListResponse
}

const getList = async (token: string, listId: string): Promise<ListResponse> => {
    const response = await request(app)
        .get(`/api/lists/${listId}`)
        .set("Authorization", `Bearer ${token}`)

    expect(response.status).toBe(200)
    return response.body as ListResponse
}

let owner: AuthenticatedUser
let wordId: number

beforeAll(async () => {
    owner = await registerUser("lists-owner")
    const word = (await testDbQuery<{ id: number }>("SELECT id FROM words ORDER BY id LIMIT 1")).rows[0]
    if (!word) {
        throw new Error("The words table must contain at least one word for list integration tests")
    }
    wordId = word.id
})

describe("list lifecycle", () => {
    it("requires authentication to get lists", async () => {
        const response = await request(app).get("/api/lists")
        expect(response.status).toBe(401)
    })

    it("creates and retrieves a list with timestamps", async () => {
        const list = await createList(owner.token, "create")
        expect(list.list_name).toContain("create-")
        expect(list.owner_id).toBeDefined()
        expect(new Date(list.created_at).getTime()).not.toBeNaN()
        expect(new Date(list.modified_at).getTime()).not.toBeNaN()
        expect(list.can_edit).toBe(true)
    })

    it("updates modified_at when a list is renamed", async () => {
        const list = await createList(owner.token, "rename")
        const before = await getList(owner.token, list.id)

        const response = await request(app)
            .patch(`/api/lists/${list.id}`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send({ newName: uniqueListName("renamed") })

        expect(response.status).toBe(200)
        const after = await getList(owner.token, list.id)
        expect(new Date(after.modified_at).getTime()).toBeGreaterThan(new Date(before.modified_at).getTime())
    })

    it("updates modified_at when a word is added and removed", async () => {
        const list = await createList(owner.token, "words")
        const beforeAdd = await getList(owner.token, list.id)

        const addResponse = await request(app)
            .post(`/api/lists/${list.id}/words/${wordId}`)
            .set("Authorization", `Bearer ${owner.token}`)
        expect(addResponse.status).toBe(201)

        const afterAdd = await getList(owner.token, list.id)
        expect(new Date(afterAdd.modified_at).getTime()).toBeGreaterThan(new Date(beforeAdd.modified_at).getTime())

        const removeResponse = await request(app)
            .delete(`/api/lists/${list.id}/words/${wordId}`)
            .set("Authorization", `Bearer ${owner.token}`)
        expect(removeResponse.status).toBe(200)

        const afterRemove = await getList(owner.token, list.id)
        expect(new Date(afterRemove.modified_at).getTime()).toBeGreaterThan(new Date(afterAdd.modified_at).getTime())
    })

    it("returns lists ordered by modified_at descending", async () => {
        const olderList = await createList(owner.token, "ordering-old")
        const newerList = await createList(owner.token, "ordering-new")

        await request(app)
            .patch(`/api/lists/${olderList.id}`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send({ newName: uniqueListName("ordering-updated") })

        const response = await request(app)
            .get("/api/lists")
            .set("Authorization", `Bearer ${owner.token}`)

        expect(response.status).toBe(200)
        const relevantLists = response.body.filter((list: ListResponse) =>
            [olderList.id, newerList.id].includes(list.id)
        ) as ListResponse[]
        expect(relevantLists).toHaveLength(2)
        expect(relevantLists[0]?.id).toBe(olderList.id)
    })
})

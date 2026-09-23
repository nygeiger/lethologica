import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import app from "../../src/server.js"

type AuthenticatedUser = {
    email: string
    token: string
}

type ListResponse = {
    id: string
    modified_at: string
}

let emailCounter = 0
let listCounter = 0
const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${emailCounter++}@example.com`
const uniqueListName = (prefix: string) => `${prefix}-${Date.now()}-${listCounter++}`

const registerUser = async (prefix: string): Promise<AuthenticatedUser> => {
    const email = uniqueEmail(prefix)
    const response = await request(app).post("/api/auth/register").send({ email, pass: "password123" })
    expect(response.status).toBe(201)
    expect(typeof response.body).toBe("string")
    return { email, token: response.body }
}

const createList = async (token: string): Promise<ListResponse> => {
    const response = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${token}`)
        .send({ listName: uniqueListName("shares") })
    expect(response.status).toBe(201)

    const listsResponse = await request(app)
        .get("/api/lists")
        .set("Authorization", `Bearer ${token}`)
    expect(listsResponse.status).toBe(200)
    return listsResponse.body[0] as ListResponse
}

const getList = async (token: string, listId: string): Promise<ListResponse> => {
    const response = await request(app)
        .get(`/api/lists/${listId}`)
        .set("Authorization", `Bearer ${token}`)
    expect(response.status).toBe(200)
    return response.body as ListResponse
}

let owner: AuthenticatedUser
let collaborator: AuthenticatedUser
let wordId: number

beforeAll(async () => {
    owner = await registerUser("shares-owner")
    collaborator = await registerUser("shares-collaborator")
    const wordResponse = await request(app)
        .get("/api/words/today")
        .set("Authorization", `Bearer ${owner.token}`)
    expect(wordResponse.status).toBe(200)
    wordId = wordResponse.body.id
})

describe("share lifecycle", () => {
    it("updates modified_at when a share is added, changed, and removed", async () => {
        const list = await createList(owner.token)
        const beforeAdd = await getList(owner.token, list.id)

        const addResponse = await request(app)
            .post(`/api/lists/${list.id}/shares`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send({ userEmail: collaborator.email, role: "viewer" })
        expect(addResponse.status).toBe(200)

        const afterAdd = await getList(owner.token, list.id)
        expect(new Date(afterAdd.modified_at).getTime()).toBeGreaterThan(new Date(beforeAdd.modified_at).getTime())

        const sharesResponse = await request(app)
            .get(`/api/lists/${list.id}/shares`)
            .set("Authorization", `Bearer ${owner.token}`)
        expect(sharesResponse.status).toBe(200)
        const shareId = sharesResponse.body[0]?.id as string
        expect(shareId).toBeDefined()

        const updateResponse = await request(app)
            .patch(`/api/lists/${list.id}/shares/${shareId}`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send({ role: "editor" })
        expect(updateResponse.status).toBe(200)

        const afterUpdate = await getList(owner.token, list.id)
        expect(new Date(afterUpdate.modified_at).getTime()).toBeGreaterThan(new Date(afterAdd.modified_at).getTime())

        const deleteResponse = await request(app)
            .delete(`/api/lists/${list.id}/shares/${shareId}`)
            .set("Authorization", `Bearer ${owner.token}`)
        expect(deleteResponse.status).toBe(200)

        const afterDelete = await getList(owner.token, list.id)
        expect(new Date(afterDelete.modified_at).getTime()).toBeGreaterThan(new Date(afterUpdate.modified_at).getTime())
    })

    it("allows a viewer to read but not edit a shared list", async () => {
        const list = await createList(owner.token)
        const addResponse = await request(app)
            .post(`/api/lists/${list.id}/shares`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send({ userEmail: collaborator.email, role: "viewer" })
        expect(addResponse.status).toBe(200)

        const readResponse = await request(app)
            .get(`/api/lists/${list.id}`)
            .set("Authorization", `Bearer ${collaborator.token}`)
        expect(readResponse.status).toBe(200)

        const renameResponse = await request(app)
            .patch(`/api/lists/${list.id}`)
            .set("Authorization", `Bearer ${collaborator.token}`)
            .send({ newName: uniqueListName("unauthorized") })
        expect(renameResponse.status).toBe(403)

        const addWordResponse = await request(app)
            .post(`/api/lists/${list.id}/words/${wordId}`)
            .set("Authorization", `Bearer ${collaborator.token}`)
        expect(addWordResponse.status).toBe(403)
    })

    it("allows an editor to modify words but not share permissions", async () => {
        const list = await createList(owner.token)
        const addResponse = await request(app)
            .post(`/api/lists/${list.id}/shares`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send({ userEmail: collaborator.email, role: "editor" })
        expect(addResponse.status).toBe(200)

        const addWordResponse = await request(app)
            .post(`/api/lists/${list.id}/words/${wordId}`)
            .set("Authorization", `Bearer ${collaborator.token}`)
        expect(addWordResponse.status).toBe(201)

        const sharesResponse = await request(app)
            .get(`/api/lists/${list.id}/shares`)
            .set("Authorization", `Bearer ${owner.token}`)
        const shareId = sharesResponse.body[0]?.id as string

        const updateResponse = await request(app)
            .patch(`/api/lists/${list.id}/shares/${shareId}`)
            .set("Authorization", `Bearer ${collaborator.token}`)
            .send({ role: "viewer" })
        expect(updateResponse.status).toBe(403)
    })
})
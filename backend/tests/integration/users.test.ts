import request from "supertest"
import { beforeAll, describe, expect, it } from "vitest"
import app from "../../src/server.js"

type User = {
    email: string
    token: string
}

let emailCounter = 0
const uniqueEmail = (prefix: string) => `${prefix}-${Date.now()}-${emailCounter++}@example.com`

const registerUser = async (prefix: string): Promise<User> => {
    const email = uniqueEmail(prefix)
    const response = await request(app).post("/api/auth/register").send({
        email,
        pass: "password123"
    })
    expect(response.status).toBe(201)
    expect(typeof response.body).toBe("string")
    return { email, token: response.body }
}

let owner: User
let candidate: User
let listId: string

beforeAll(async () => {
    owner = await registerUser("search-owner")
    candidate = await registerUser("search-candidate")

    const createListResponse = await request(app)
        .post("/api/lists")
        .set("Authorization", `Bearer ${owner.token}`)
        .send({ listName: `search-list-${Date.now()}` })
    expect(createListResponse.status).toBe(201)

    const listsResponse = await request(app)
        .get("/api/lists")
        .set("Authorization", `Bearer ${owner.token}`)
    expect(listsResponse.status).toBe(200)
    listId = listsResponse.body[0].id
})

describe("GET /api/users/search", () => {
    it("requires authentication", async () => {
        const response = await request(app)
            .get(`/api/users/search?email=${encodeURIComponent(candidate.email)}&listId=${listId}`)

        expect(response.status).toBe(401)
    })

    it("requires email and listId query parameters", async () => {
        const response = await request(app)
            .get("/api/users/search")
            .set("Authorization", `Bearer ${owner.token}`)

        expect(response.status).toBe(400)
    })

    it("finds users by partial email", async () => {
        const candidateEmailPrefix = candidate.email.substring(0, candidate.email.indexOf("@"))
        const response = await request(app)
            .get(`/api/users/search?email=${encodeURIComponent(candidateEmailPrefix)}&listId=${listId}`)
            .set("Authorization", `Bearer ${owner.token}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual([{ id: expect.any(String), email: candidate.email }])
    })

    it("does not return the current user or an existing list share", async () => {
        const currentUserResponse = await request(app)
            .get(`/api/users/search?email=${encodeURIComponent(owner.email)}&listId=${listId}`)
            .set("Authorization", `Bearer ${owner.token}`)
        expect(currentUserResponse.status).toBe(200)
        expect(currentUserResponse.body).toEqual([])

        const shareResponse = await request(app)
            .post(`/api/lists/${listId}/shares`)
            .set("Authorization", `Bearer ${owner.token}`)
            .send({ userEmail: candidate.email, role: "viewer" })
        expect(shareResponse.status).toBe(200)

        const sharedUserResponse = await request(app)
            .get(`/api/users/search?email=${encodeURIComponent(candidate.email)}&listId=${listId}`)
            .set("Authorization", `Bearer ${owner.token}`)
        expect(sharedUserResponse.status).toBe(200)
        expect(sharedUserResponse.body).toEqual([])
    })

    it("returns an empty array when no users match", async () => {
        const response = await request(app)
            .get(`/api/users/search?email=missing-${Date.now()}&listId=${listId}`)
            .set("Authorization", `Bearer ${owner.token}`)

        expect(response.status).toBe(200)
        expect(response.body).toEqual([])
    })
})

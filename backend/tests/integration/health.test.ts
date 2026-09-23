import request from "supertest"
import { describe, expect, it } from "vitest"
import app from "../../src/server.js"

describe("GET /api/health", () => {
    it("returns the application and database health", async () => {
        const response = await request(app).get("/api/health")

        expect(response.status).toBe(200)
        expect(response.body).toEqual({
            message: "Health check O.K.",
            dbHealth: "Hello world!"
        })
    })
})





/*
GET /api/words/today — returns a word for an authenticated user
GET /api/words/today — returns 401 without a token
PATCH /api/words/:wordId/review — valid rating returns 200 and updated progress
PATCH /api/words/:wordId/review — invalid rating (out of range or wrong type) returns 400
GET /api/words/history — returns empty array for a user with no reviews yet
GET /api/words/history — returns progress after a word has been reviewed
*/

import { assertType, beforeAll, describe, expect, it } from "vitest";
import request from 'supertest';
import app from "../../src/server.js";
import type { Word } from "../../src/modules/words/types.js";
import { testDbQuery } from "../setup/globalSetup.js";

let token: string
let word: Word

beforeAll(async () => {
    const getWord = (await testDbQuery<Word>("SELECT * FROM words ORDER BY id LIMIT 1")).rows[0]
    if (getWord?.id) {
        word = getWord
    } else {
        throw new Error(`Database connection failed: failed initial WORD query`);
    }
    const response = await request(app).post('/api/auth/register').send({
        email: 'testWords@example.com',
        pass: 'password123'
    })
    token = response.body
})

describe('GET /api/words/today', () => {
    it('returns a word for an authenticated user', async () => {
        const response = await request(app).get('/api/words/today')
            .set('Authorization', `Bearer ${token}`).send()
        expect(response.status).toBe(200)
        assertType<Word>(response.body)
    })

    it('returns 401 without a token', async () => {
        const response = await request(app).get('/api/words/today').send()
        expect(response.status).toBe(401)
    })
})

describe('PATCH /api/words/:wordId/review', () => {
    it('valid rating returns 200 and updated progress', async () => {
        const response = await request(app).patch(`/api/words/${word.id}/review`)
            .set('Authorization', `Bearer ${token}`)
            .send({ rating: "3" })
        expect(response.status).toBe(200)
        assertType<Word>(response.body)
    })

    it('invalid rating (out of range or wrong type) returns 400', async () => {
        const response = await request(app).patch(`/api/words/${word.id}/review`)
            .set('Authorization', `Bearer ${token}`)
            .send({ rating: "7" })
        expect(response.status).toBe(400)
    })
})

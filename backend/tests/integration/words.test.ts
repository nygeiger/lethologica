import request from 'supertest';
import { beforeAll, describe, expect, it } from "vitest";
import app from "../../src/server.js";
import { JoinedWordAndUWPResultSchema, userWordProgressSchema, wordSchema, type Word } from "../../src/modules/words/types.js";
import { testDbQuery } from '../config/db.js';

/*
GET /api/words/today — returns a word for an authenticated user
GET /api/words/today — returns 401 without a token
PATCH /api/words/:wordId/review — valid rating returns 200 and updated progress
PATCH /api/words/:wordId/review — invalid rating (out of range or wrong type) returns 400
GET /api/words/history — returns empty array for a user with no reviews yet
GET /api/words/history — returns progress after a word has been reviewed
*/

const getHistoryResponseSchema = JoinedWordAndUWPResultSchema.min(1, "At least 1 word required")
let userToken1: string
let noHistoryUserToken: string
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
    userToken1 = response.body
    const response2 = await request(app).post('/api/auth/register').send({
        email: 'testWords2@example.com',
        pass: 'password123'
    })
    noHistoryUserToken = response2.body
})

describe('GET /api/words/today', () => {
    it('returns a word for an authenticated user', async () => {
        const response = await request(app).get('/api/words/today')
            .set('Authorization', `Bearer ${userToken1}`).send()
        expect(response.status).toBe(200)
        expect(wordSchema.safeParse(response.body).success).toBe(true)
    })

    it('returns 401 without a token', async () => {
        const response = await request(app).get('/api/words/today').send()
        expect(response.status).toBe(401)
    })
})

describe('PATCH /api/words/:wordId/review', () => {
    it('valid rating returns 200 and updated progress', async () => {
        const response = await request(app).patch(`/api/words/${word.id}/review`)
            .set('Authorization', `Bearer ${userToken1}`)
            .send({ rating: "3" })
        expect(response.status).toBe(200)
        expect(userWordProgressSchema.safeParse(response.body).success).toBe(true)
    })

    it('invalid rating (out of range or wrong type) returns 400', async () => {
        const response = await request(app).patch(`/api/words/${word.id}/review`)
            .set('Authorization', `Bearer ${userToken1}`)
            .send({ rating: "7" })
        expect(response.status).toBe(400)
    })
})

describe('GET /api/words/history', () => {
    it('returns empty array for a user with no reviews yet', async () => {
        const response = await request(app).get(`/api/words/history`)
            .set('Authorization', `Bearer ${noHistoryUserToken}`)
            .send()
        expect(response.status).toBe(200)
        expect(response.body).toStrictEqual([])
    })

    it('returns progress after a word has been reviewed', async () => {
        const response = await request(app).get(`/api/words/history`)
            .set('Authorization', `Bearer ${userToken1}`)
            .send()
        expect(response.status).toBe(200)
        expect(getHistoryResponseSchema.safeParse(response.body).success).toStrictEqual(true)
    })
})

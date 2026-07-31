import request from 'supertest'
import { beforeAll, describe, expect, it } from 'vitest'
import jwt from 'jsonwebtoken'
import z from 'zod';
import app from '../../src/server.js'
import testEnv from '../config/env.js';

/*
POST /api/auth/register — happy path returns 201 and a token
POST /api/auth/register — duplicate email returns 401
POST /api/auth/login — happy path returns 200 and a token
POST /api/auth/login — wrong password returns 401
POST /api/auth/login — non-existent email returns 404
GET /api/auth/me — valid token returns user data
GET /api/auth/me — no token returns 401
*/

const authedLoginResponse = z.object({
    id: z.string(),
    email: z.email(),
    created_at: z.string()
})

let token: string;

beforeAll(async () => {
    const response = await request(app).post('/api/auth/register').send({
        email: 'testAuth@example.com',
        pass: 'password123'
    })
    token = response.body
})

describe('POST /api/auth/register', () => {

    it('happy path returns 201 and a token', async () => {
        const response = await request(app).post('/api/auth/register').send({
            email: 'test@example.com',
            pass: 'password123'
        })
        expect(response.status).toBe(201)
        expect(jwt.verify(response.body, testEnv.JWT_SECRET)).toBeDefined()
    })

    it('duplicate email returns 409', async () => {
        const response = await request(app).post('/api/auth/register').send({
            email: 'test@example.com',
            pass: 'password123'
        })
        expect(response.status).toBe(409)
    })
})

describe('POST /api/auth/login', () => {
    it('happy path returns 200 and a token', async () => {
        const response = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            pass: 'password123'
        })
        expect(response.status).toBe(200)
        expect(jwt.verify(response.body, testEnv.JWT_SECRET)).toBeDefined()
    })

    it('wrong password returns 401', async () => {
        const response = await request(app).post('/api/auth/login').send({
            email: 'test@example.com',
            pass: 'pasword12'
        })
        expect(response.status).toBe(401)
    })

    it('non-existent email returns 401', async () => {
        const response = await request(app).post('/api/auth/login').send({
            email: 'testWrong@example.com',
            pass: 'password123'
        })
        expect(response.status).toBe(401)
    })
})

describe('GET /api/auth/me', () => {

    it('valid token returns user data', async () => {
        const response = await request(app).get('/api/auth/me')
            .set('Authorization', `Bearer ${token}`)
            .send()
        expect(response.status).toBe(200)
        expect(authedLoginResponse.safeParse(response.body).success).toBe(true)
    })

    it('no token returns 401', async () => {
        const response = await request(app).get('/api/auth/me').send()
        expect(response.status).toBe(401)
    })
})
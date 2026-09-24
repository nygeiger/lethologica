import axios, { AxiosError } from "axios"
import z, { ZodError } from "zod";
import env from "../config/env"
import { ApiError } from "../utils/ApiError";

const HEALTH_URL = `/health`
const AUTH_URL = `/auth`
const LIST_URL = `/lists`
const WORDS_URL = `/words`

let authToken: string = ''
export function setAuthToken(token: string) {
    authToken = token
}

//?: Check if jwt has expired on each request?

const api = axios.create({
    baseURL: env.VITE_SERVER_URL
})
api.interceptors.request.use((config) => {
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`
    }
    return config
})

const handleApiError = (error: unknown): ApiError => {
    if (error instanceof ApiError) {
        return error;
    } else if (error instanceof AxiosError) {
        if (error.response?.data.name === "ZodError") {
            const zodErr = JSON.parse(error.response?.data.message)[0]
            return new ApiError(zodErr.code, error.status ?? 500)
        } else if (error.response?.data === "23505") {
            return new ApiError("resource already exists", 500)
        } else if (error.status === 404) {
            return new ApiError(error.response?.data.message ?? "resource(s) not found", error.status)
        }
        // console.log(new ApiError(error.response!.data.message, error.status!));
        return new ApiError(error.response!.data.message, error.status!);
    } else if (error instanceof ZodError) {
        return new ApiError(error.issues[0].code, 500)
    }
    return new ApiError("Failed to perform request", 500);
}


/* health */
const healthCheckResponseSchema = z.object({
    message: z.string(),
    dbHealth: z.string()
})

export const getHealthCheck = async () => {
    try {
        const response = await api.get(HEALTH_URL);
        const healthCheckResponse = healthCheckResponseSchema.parse(response.data);
        return healthCheckResponse;
    } catch (error) {
        // console.log("Error getting HealthCheck: ", error);
        handleApiError(error)
    }
}

/* auth */
const userResponseSchema = z.object({
    id: z.string(),
    email: z.string(),
    created_at: z.string().optional()
})
export type User = z.infer<typeof userResponseSchema>

export const postLogin = async (email: string, pass: string): Promise<string> => {
    try {
        const response = await api.post(`${AUTH_URL}/login`, { email, pass })
        const userToken = z.jwt().parse(response.data);
        return userToken;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const postRegister = async (email: string, pass: string): Promise<string> => {
    try {
        const response = (await api.post(`${AUTH_URL}/register`, { email, pass }));
        const userToken = z.jwt().parse(response.data);
        return userToken;
    } catch (error) {
        throw handleApiError(error)
    }
}



export const getUser = async (): Promise<User> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${AUTH_URL}/me`);
        const user = userResponseSchema.parse(response.data);
        return user;
    } catch (error) {
        throw handleApiError(error)
    }
}

/* list */
const listSchema = z.object({
    id: z.string(),
    list_name: z.string(),
    owner_id: z.string(),
    created_at: z.string(),
    modified_at: z.string(),
    can_edit: z.boolean()
})
const listWordsSchema = z.array(z.object({
    "id": z.coerce.number(),
    "word": z.string(),
    "def": z.string(),
    "example": z.string(),
    "pronunciation_url": z.string()
}))
const getListsResponseSchema = z.array(listSchema)
export type List = z.infer<typeof listSchema>

export const getUsersLists = async (): Promise<List[]> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${LIST_URL}`);
        const lists = getListsResponseSchema.parse(response.data);
        return lists;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const getList = async (listId: string): Promise<List> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${LIST_URL}/${listId}`);
        const list = listSchema.parse(response.data);
        return list;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const getListWords = async (listId: string): Promise<Word[]> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${LIST_URL}/${listId}/words`);
        const listWords = listWordsSchema.parse(response.data);
        return listWords;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const createList = async (listName: string): Promise<string> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.post(`${LIST_URL}`, { listName });
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}



export const addWordToList = async (listId: string, wordId: string): Promise<string> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.post(`${LIST_URL}/${listId}/words/${wordId}`);
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const renameList = async (listId: string, newName: string): Promise<string> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.patch(`${LIST_URL}/${listId}`, { newName });
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const deleteList = async (listId: string): Promise<string> => {
    try {
        const response = await api.delete(`${LIST_URL}/${listId}`);
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const removeWordFromList = async (listId: string, wordId: string): Promise<string> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.delete(`${LIST_URL}/${listId}/words/${wordId}`);
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}

/* shares */
const roles = ["editor", "owner", "viewer"] as const
type Role = typeof roles[number]
const shareSchema = z.object({
    id: z.string(),
    list_id: z.string(),
    shared_with_user_id: z.string(),
    role: z.enum(roles),
    created_at: z.string(),
    shared_with_email: z.string()
})
export type Share = z.infer<typeof shareSchema>

export const getListShares = async (listId: string): Promise<Share[]> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${LIST_URL}/${listId}/shares`);
        if (response.data.message) {
            return [] // message === "No shares found"
        }
        const shares = z.array(shareSchema).parse(response.data)
        return shares;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const addShare = async (listId: string, userEmail: string, role: Role): Promise<string> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.post(`${LIST_URL}/${listId}/shares`, { userEmail, role });
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const updateShare = async (listId: string, shareId: string, role: Role): Promise<string> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.patch(`${LIST_URL}/${listId}/shares/${shareId}`, { role });
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const deleteShare = async (listId: string, shareId: string): Promise<string> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.delete(`${LIST_URL}/${listId}/shares/${shareId}`);
        return response.data.message satisfies string;
    } catch (error) {
        throw handleApiError(error)
    }
}

/* words */
export const userWordProgressSchema = z.object({
    id: z.coerce.string(),
    user_id: z.string(),
    word_id: z.coerce.number(),
    ease_factor: z.coerce.number(),
    interval_days: z.coerce.number(),
    next_review_at: z.string(),
    last_reviewed_at: z.string(),
    times_reviewed: z.coerce.number(),
    times_correct: z.coerce.number()
})
export const wordSchema = z.object({
    id: z.coerce.number(),
    word: z.string(),
    def: z.string(),
    example: z.string(),
    pronunciation_url: z.string()
});
const wordQuerySchema = wordSchema.extend(userWordProgressSchema.partial().shape)
const wordOptionSchema = z.object({ id: z.coerce.number(), def: z.string() })
export const joinedWordAndUWPSchema = z.array(z.object({ word: wordSchema, uwp: userWordProgressSchema }))
export type UserWordProgress = z.infer<typeof userWordProgressSchema>;
export type Word = z.infer<typeof wordSchema>;
export type WordQueryResult = z.infer<typeof wordQuerySchema>
export type WordOption = z.infer<typeof wordOptionSchema>
export type JoinedWordAndUWPResult = z.infer<typeof joinedWordAndUWPSchema>;

export const getNextWord = async (): Promise<WordQueryResult> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${WORDS_URL}/today`);
        const nextWord = wordQuerySchema.parse(response.data)
        return nextWord;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const getWordById = async (wordId: number): Promise<Word> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${WORDS_URL}/${wordId}`);
        return wordSchema.parse(response.data);
    } catch (error) {
        throw handleApiError(error)
    }
}

export const getRandomWords = async (exclude: number, limit: number): Promise<WordOption[]> => {
    if (!authToken) throw new ApiError("user not authorized", 401);
    const response = await api.get(`/words/random?exclude=${exclude}&limit=${limit}`)
    return z.array(z.object({ id: z.number(), def: z.string() })).parse(response.data)
}

export const updateUserWordProgress = async (wordId: number, rating: number): Promise<UserWordProgress> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.patch(`${WORDS_URL}/${wordId}/review`, { rating });
        const updatedWordProgress = userWordProgressSchema.parse(response.data)
        return updatedWordProgress;
    } catch (error) {
        throw handleApiError(error)
    }
}

export const getUserHistory = async (): Promise<JoinedWordAndUWPResult> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${WORDS_URL}/history`);
        const userHistory = joinedWordAndUWPSchema.parse(response.data)
        return userHistory;
    } catch (error) {
        throw handleApiError(error)
    }
}

/* users */
const userSearchSchema = z.array(z.object({ id: z.string(), email: z.string() }))
export const searchUsers = async (emailQuery: string, listId: string): Promise<{ id: string, email: string }[]> => {
    try {
        if (!authToken) throw new ApiError("user not authorized", 401);
        const response = await api.get(`${AUTH_URL.replace('/auth', '/users')}/search`, { params: { email: emailQuery, listId } })
        const users = userSearchSchema.parse(response.data)
        return users
    } catch (error) {
        throw handleApiError(error)
    }
}

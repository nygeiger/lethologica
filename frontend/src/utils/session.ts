const LOCAL_STORAGE_KEYS = {
    jwt: "lethologica.jwt",
    user: "lethologica.user",
    answers: 'lethologica.answers',
    words: 'lethologica.words',
    viewed: 'lethologica.viewed',
} as const

export type HistoryEntry = {
    wordId: number
    options: { text: string, id: number }[]
    answers: string[] // option ids the user picked, in order
}

// const lsJwtKey = "jwt";
// const lsUserKey = "user";
export const userStorage = {
    clearAll: () => Object.values(LOCAL_STORAGE_KEYS).forEach(k => localStorage.removeItem(k)),

    getJWT: () => localStorage.getItem(LOCAL_STORAGE_KEYS.jwt),
    setJWT: (token: string) => localStorage.setItem(LOCAL_STORAGE_KEYS.jwt, token),
    clearJWT: () => localStorage.removeItem(LOCAL_STORAGE_KEYS.jwt),

    getUser: () => localStorage.getItem(LOCAL_STORAGE_KEYS.user),
    setUser: (userId: string) => localStorage.setItem(LOCAL_STORAGE_KEYS.user, userId),
    clearUser: () => localStorage.removeItem(LOCAL_STORAGE_KEYS.user),

    loadAnswers: (): string[] => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.answers)
            return raw ? JSON.parse(raw) : []
        } catch (err) {
            return []
        }
    },

    saveAnswers: (answers: string[]) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.answers, JSON.stringify(answers))
        } catch (err) {
            // ignore
        }
    },

    clearStoredAnswers: () => {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.answers)
        } catch (err) {
            // ignore
        }
    },

    loadOptions: (): { text: string, id: number }[] => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.words)
            return raw ? JSON.parse(raw) : []
        } catch (err) {
            return []
        }
    },

    saveOptions: (options: { text: string, id: number }[]) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.words, JSON.stringify(options))
        } catch (err) {
            // ignore
        }
    },

    clearStoredOptions: () => {
        try {
            localStorage.removeItem(LOCAL_STORAGE_KEYS.words)
        } catch (err) {
            // ignore
        }
    },

    loadHistory: (): HistoryEntry[] => {
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEYS.viewed)
            const parsed: unknown = raw ? JSON.parse(raw) : []
            if (!Array.isArray(parsed)) return []
            // drop entries from older storage formats (bare word ids)
            return parsed.filter((e): e is HistoryEntry =>
                typeof e === "object" && e !== null && typeof e.wordId === "number"
                && Array.isArray(e.options) && Array.isArray(e.answers))
        } catch (err) {
            return []
        }
    },

    saveHistory: (history: HistoryEntry[]) => {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEYS.viewed, JSON.stringify(history))
        } catch (err) {
            // ignore
        }
    }
}
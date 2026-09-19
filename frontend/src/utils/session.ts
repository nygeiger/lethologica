const LOCAL_STORAGE_KEYS = {
    answers: 'lethologica.answers',
    words: 'lethologica.words',
} as const

export const userStorage = {
    clearAll: () => Object.values(LOCAL_STORAGE_KEYS).forEach(k => localStorage.removeItem(k)),

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
    }
}
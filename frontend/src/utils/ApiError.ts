export class ApiError extends Error {
    status: number
    message: string //! strictly defined here purely so that it will print easier

    constructor(message: string, status: number) {
        super(message)
        this.name = 'ApiError'
        this.status = status
        this.message = message
    }
}
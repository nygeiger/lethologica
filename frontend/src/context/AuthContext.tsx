import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "../api/client";
import { userStorage } from "@/utils/session";

export interface AuthContextType {
    token: string;
    userId: string;
    login: (jwt: string) => void;
    logout: () => void;
}

const AuthCContext = createContext<AuthContextType | undefined>(undefined);

interface AuthContextProviderProps {
    children: ReactNode;
}

interface AuthTokenPayload {
    userId: string;
    iat: number;
    exp: number;
}

export const AuthContextProvider = ({ children }: AuthContextProviderProps) => {
    const [token, setToken] = useState("")
    const [userId, setUserId] = useState("");
    const [authReady, setAuthReady] = useState(false)

    useEffect(() => {
        const stored = userStorage.getJWT()
        if (stored) {
            const decoded = jwtDecode<AuthTokenPayload>(stored)
            if (decoded.exp * 1000 > Date.now()) {
                setToken(stored)
                setAuthToken(stored)  // set module-level token immediately
                setUserId(decoded.userId)
            } else {
                userStorage.clearJWT()
            }
        }
        setAuthReady(true)  // auth is initialized regardless of whether token exists
    }, [])

    useEffect(() => {
        if (token) {
            userStorage.setJWT(token)
            const newUser = jwtDecode<AuthTokenPayload>(token);
            setUserId(newUser.userId);
            userStorage.setUser(newUser.userId)
        } else {
            userStorage.clearJWT()
            userStorage.clearUser()
            setUserId("");
        }
    }, [token])

    function login(jwt: string) { setToken(jwt); setAuthToken(jwt); }
    function logout() { setToken(""); setAuthToken(""); }

    if (!authReady) return <div className="flex items-center justify-center h-screen">Loading Account...</div>

    return (
        <AuthCContext value={{ token, userId, login, logout }}>
            {children}
        </AuthCContext>
    );
};

export const useAuthContext = () => {
    const context = useContext(AuthCContext);
    if (context === undefined) {
        throw new Error('useAuthContext must be used within a AuthContextProvider');
    }
    return context;
}
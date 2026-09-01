import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { jwtDecode } from "jwt-decode";
import { setAuthToken } from "../api/client";

const lsJwtKey = "jwt";
const lsUserKey = "user";

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
    const [token, setToken] = useState<string>(() => {
        const stored = localStorage.getItem(lsJwtKey);
        if (!stored) return "";
        const decoded = jwtDecode<AuthTokenPayload>(stored);
        if (decoded.exp * 1000 < Date.now()) {
            localStorage.removeItem(lsJwtKey);
            localStorage.removeItem(lsUserKey);
            return "";
        }
        return stored;
    });
    const [userId, setUserId] = useState<string>(localStorage.getItem(lsUserKey) || "");

    useEffect(() => {
        if (token) {
            localStorage.setItem(lsJwtKey, token);
            const newUser = jwtDecode<AuthTokenPayload>(token);
            setUserId(newUser.userId);
            localStorage.setItem(lsUserKey, newUser.userId);
        } else {
            localStorage.removeItem(lsJwtKey);
            localStorage.removeItem(lsUserKey);
            setUserId("");
        }
        setAuthToken(token)
    }, [token])

    function login(jwt: string) { setToken(jwt); }
    function logout() { setToken(""); }

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
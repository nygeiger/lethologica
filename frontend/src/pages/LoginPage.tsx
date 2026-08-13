import { Button } from "@/components/ui/button";
import { postLogin } from "../api/client"
import { useAuthContext } from "../context/AuthContext"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export const LoginPage = () => {
    return (
        <div className="flex flex-col gap-25 items-center justify-center">
            <h1 className="text-2xl pt-20">Lethologica</h1>
            <LoginCard />
        </div>
    )
}

const LoginCard = () => {
    const navigate = useNavigate()
    const authContext = useAuthContext();
    const [loginFailed, setLoginFailed] = useState(false)
    const [loginState, setLoginState] = useState<{ email: string, pass: string }>({ email: "", pass: "" })

    const handleInput = (e: React.InputEvent<HTMLInputElement>) => {
        setLoginState({ ...loginState, [e.currentTarget.id]: e.currentTarget.value })
    }

    const handleLogin = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const token = await postLogin(loginState.email, loginState.pass)
            authContext.login(token)
            navigate("/today")
        } catch (error) {
            setLoginFailed(true)
        }
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>
                    Enter your email below to login to your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="login" onSubmit={handleLogin}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                onInput={handleInput}
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                {/* <a
                                    href="#"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password?
                                </a> */}
                            </div>
                            <Input
                                id="pass"
                                type="password"
                                onInput={handleInput}
                                required />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" form="login" className="w-full" onClick={() => { console.log("clicked") }}>
                    Login
                </Button>
                {/* <Button variant="outline" className="w-full">
                    Login with Google
                </Button> */}
                <Button variant="outline" className="w-full">
                    Continue as guest
                </Button>
                {loginFailed && <span className="text-red-500">The username or password you entered is incorrect</span>}
            </CardFooter>
        </Card>
    )
}
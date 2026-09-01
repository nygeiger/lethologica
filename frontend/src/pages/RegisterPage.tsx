import { Button } from "@/components/ui/button";
import { postRegister } from "../api/client"
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
import { ApiError } from "@/utils/ApiError";

const RegisterPage = () => {
    return (
        <>
            <div className="flex flex-col gap-25 items-center justify-center">
                <h1 className="text-2xl pt-20">Lethologica</h1>
                <RegisterCard />
            </div>
        </>
    )
}
export default RegisterPage;

const RegisterCard = () => {
    const navigate = useNavigate()
    const authContext = useAuthContext();
    const [errorMessage, setErrorMessage] = useState("")
    const [registerState, setRegisterState] = useState<{ email: string, pass: string }>({ email: "", pass: "" })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setRegisterState({ ...registerState, [e.currentTarget.id]: e.currentTarget.value })
        setErrorMessage("")
    }

    const handleRegister = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        try {
            const token = await postRegister(registerState.email, registerState.pass)
            authContext.login(token)
            navigate("/today")
        } catch (error) {
            if (error instanceof ApiError) {
                setErrorMessage(error.message)
            }
        }
    }

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Create your account</CardTitle>
                <CardDescription>
                    Enter your email and password below to create your account
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form id="register" onSubmit={handleRegister}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                onChange={handleChange}
                                autoComplete="username"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                            </div>
                            <Input
                                id="pass"
                                type="password"
                                onChange={handleChange}
                                autoComplete="new-password"
                                required />
                        </div>
                    </div>
                </form>
                {errorMessage && <span className="text-red-500">{errorMessage}</span>}
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" form="register" className="w-full" >
                    Register
                </Button>
                <Button variant="outline" className="w-full mt-4 bg-gray-300" onClick={() => { navigate("/login") }}>
                    Cancel
                </Button>
            </CardFooter>
        </Card>
    )
}
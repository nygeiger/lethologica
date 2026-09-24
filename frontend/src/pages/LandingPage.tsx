import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

const steps = [
    {
        title: "One word at a time",
        description: "Each day you're shown a word and asked to pick its definition from four choices."
    },
    {
        title: "Rate your recall",
        description: "Once you get it right, tell us how easily it came back to you."
    },
    {
        title: "Review at the right time",
        description: "Spaced repetition brings each word back just before you'd forget it, so it sticks."
    }
]

const LandingPage = () => {
    const { token } = useAuthContext()
    const navigate = useNavigate()

    if (token) return <Navigate to="/today" replace />

    return (
        <div className="flex flex-col items-center gap-16 px-4 pb-20">
            <header className="flex flex-col items-center gap-6 pt-24 text-center max-w-xl">
                <h1 className="text-4xl">Lethologica</h1>
                <p className="text-sm text-muted-foreground italic">
                    lethologica (n.) — the inability to remember a word
                </p>
                <p className="text-lg">
                    Build a vocabulary you can actually recall, one word at a time.
                </p>
                <div className="flex gap-3">
                    <Button size="lg" onClick={() => navigate("/register")}>Get started</Button>
                    <Button size="lg" variant="outline" onClick={() => navigate("/login")}>Log in</Button>
                </div>
            </header>

            <section className="w-full max-w-4xl grid gap-4 sm:grid-cols-3">
                {steps.map((step, index) => (
                    <Card key={step.title}>
                        <CardHeader>
                            <CardDescription>Step {index + 1}</CardDescription>
                            <CardTitle>{step.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm text-muted-foreground">
                            {step.description}
                        </CardContent>
                    </Card>
                ))}
            </section>

            <section className="flex flex-col items-center gap-3 text-center max-w-xl">
                <h2 className="text-xl">Make it yours</h2>
                <p className="text-sm text-muted-foreground">
                    Save words to your own lists, share them with friends, and look back at every word
                    you've studied and how you answered.
                </p>
            </section>
        </div>
    )
}
export default LandingPage;

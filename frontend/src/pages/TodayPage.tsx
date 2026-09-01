import { Button } from "@/components/ui/button";
import { getNextWord, getUser, updateUserWordProgress, type WordQueryResult } from "../api/client"
import { useAuthContext } from "../context/AuthContext"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { MenuIcon } from 'lucide-react';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/utlis/ApiError";
import { cn } from "@/lib/utils";
import { shuffleArray } from "../utlis/utils.ts"
import { useNavigate } from "react-router-dom";

const ANSWERS_STORAGE_KEY = 'lethologica.answers'


function loadAnswers(): string[] {
    try {
        const raw = localStorage.getItem(ANSWERS_STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch (err) {
        return []
    }
}

function saveAnswers(answers: string[]) {
    try {
        localStorage.setItem(ANSWERS_STORAGE_KEY, JSON.stringify(answers))
    } catch (err) {
        // ignore
    }
}

function clearStoredAnswers() {
    try {
        localStorage.removeItem(ANSWERS_STORAGE_KEY)
    } catch (err) {
        // ignore
    }
}

const TodayPage = () => {
    const authContext = useAuthContext();
    const [currentWord, setCurrentWord] = useState<WordQueryResult>()
    const [incorrectChosen, setIncorrectChosen] = useState(false)
    const [correctChosen, setCorrectChosen] = useState(false)
    const [answers, setAnswers] = useState<string[]>(() => loadAnswers())
    const [options, setOptions] = useState<{ text: string, id: string | number }[]>([])
    const currentId = String(currentWord?.word_id ?? currentWord?.id)

    const nextWord = async () => {
        try {
            const word = await getNextWord() satisfies WordQueryResult
            setCurrentWord(word)
        } catch (err) {

        }
    }

    const clearAnswers = () => {
        clearStoredAnswers()
        setAnswers([])
    }

    useEffect(() => {
        nextWord()
    }, [])

    useEffect(() => {
        if (currentWord) {
            setOptions(shuffleArray([
                { text: currentWord.def, id: currentWord?.word_id ?? currentWord?.id! },
                { text: "Temp Choice 2", id: '9999' },
                { text: "Temp Choice 3", id: '9998' },
                { text: "Temp Choice 4", id: '9997' }
            ]))

            if (answers.includes(String(currentId))) {
                setCorrectChosen(true)
            }
            if (answers.length > 0 && !answers.every((val) => val === currentId)) {
                setIncorrectChosen(true)
            }
        }
    }, [currentWord])

    const handleAnswer = (choiceId: string) => {
        const isCorrect = choiceId === currentId
        const next = [...answers, choiceId]
        setAnswers(next)
        saveAnswers(next)

        if (isCorrect) setCorrectChosen(true)
        else setIncorrectChosen(true)
    }

    const handleLogout = () => {
        clearAnswers()
        authContext.logout()
    }

    const handleUpdateProgress = async (rating: number) => {
        try {
            await updateUserWordProgress(Number(currentId), rating)

            clearAnswers()

            setIncorrectChosen(false)
            setCorrectChosen(false)

            await nextWord()
        } catch (err) {
            if (err instanceof ApiError) {
                const { stack, ...error } = err
                console.error("Error when updated word progress", error)
                return
            }
        }

    }

    return (
        <>
            <div className="absolute top-0 right-0"><Menu handleLogout={handleLogout} /></div>
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-2xl pt-20 mb-25">Lethologica</h1>
                {currentWord ?
                    <div>
                        <WordCard word={currentWord} displayDef={false} />
                        <OptionsGrid
                            correctId={currentWord.word_id ?? currentWord.id!}
                            correctChosen={correctChosen}
                            options={options}
                            answers={answers}
                            onAnswer={handleAnswer}
                        />
                        <Rating correctChosen={correctChosen} showCorrect={!incorrectChosen} handleUpdateProgress={handleUpdateProgress} />
                    </div>
                    : <div>Loading...</div>}
            </div>
        </>
    )
}
export default TodayPage;

interface MenuProps {
    handleLogout: () => void
}

export function Menu(props: MenuProps) {
    const { handleLogout } = props
    const navigate = useNavigate()
    const [open, setOpen] = useState(false)
    const [userEmail, setUserEmail] = useState<String>()

    const getUserEmail = async () => {
        try {
            const user = await getUser()
            setUserEmail(user.email)
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <Drawer
            open={open}
            onOpenChange={(isOpen) => {
                setOpen(isOpen)
                if (isOpen && !userEmail) getUserEmail() // hitting client on mount can happen before authtoken set
            }}
            swipeDirection="right"
        >
            <DrawerTrigger render={<Button variant="ghost"><MenuIcon className="size-5" /></Button>} />
            <DrawerContent>
                <DrawerHeader>
                    {/* <DrawerTitle>{userEmail}</DrawerTitle> */}
                    {/* <DrawerDescription>{userEmail}</DrawerDescription> */}
                </DrawerHeader>
                <div className="flex flex-col scroll-fade overflow-y-auto p-4">

                    <Button variant={"link"} onClick={() => navigate("/history")}>View History</Button>
                    <Button variant={"link"} onClick={() => navigate("/lists")}>View Lists</Button>
                </div>
                <DrawerFooter>
                    <span className="text-gray-400">{userEmail}</span>
                    <Button variant={"destructive"} onClick={handleLogout}>Logout</Button>
                    <DrawerClose render={<Button variant="outline">Close</Button>} />
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}

interface WordCardProps {
    word: WordQueryResult
    displayDef: boolean
    getPreviousWord?: () => void
}

// will this truly only be displayed in TodayPage? Should get next word be a prop or should it be within the component? Same with word?
// This could be used with lists as well. This would mean that methods for getting word should be abstracted away from component
const WordCard = (props: WordCardProps) => {

    const { word, displayDef } = props
    // const [displayDef, setDisplayDef] = useState(false) // probably a prop value (usecase = display def when in lists or possibly going back to previous)
    const [validAudio, setValidAudio] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        setValidAudio(false)
        if (!word.pronunciation_url) {
            setValidAudio(false)
            audioRef.current = null
            return
        }

        const audio = new Audio(word.pronunciation_url)
        const timeout = setTimeout(() => {
            audio.src = ''  // abort the load
            setValidAudio(false)
            audioRef.current = null
        }, 3000)

        audio.addEventListener('canplaythrough', () => {
            clearTimeout(timeout)
            setValidAudio(true)
        })

        audio.addEventListener('error', () => {
            clearTimeout(timeout)
            setValidAudio(false)
            audioRef.current = null
        })

        audioRef.current = audio
        audio.load()

        return () => {
            clearTimeout(timeout)
        }
    }, [word])

    const handleAudio = () => {
        audioRef.current?.play()
    }


    return (
        <Card className="w-full max-w-sm mb-10">
            <CardHeader>
                <CardTitle>
                    <span className="mr-2">{word.word}</span>
                    {validAudio && <button onClick={handleAudio}>
                        <img src="./icons/audio-speaker.svg" width={20} height={20} />
                    </button>}
                </CardTitle>
                <CardDescription>
                    {displayDef && word.def}
                </CardDescription>
            </CardHeader>
            <CardContent>
                {word.example}
            </CardContent>
            <CardFooter className="flex-col gap-2">
            </CardFooter>
        </Card>
    )
}

interface QuestionsGridProps {
    answers: string[]
    correctId: string | number
    correctChosen: boolean
    options: { text: string, id: string | number }[]
    onAnswer: (choiceId: string) => void
}

const cellStyling = "flex text-center text-black justify-center items-center outline-1 outline-black overflow-y-auto hover:cursor-pointer";
const correctCell = "bg-green-500 text-white hover:cursor-default"
const incorrectCell = "bg-red-500 text-white hover:cursor-default"
const OptionsGrid = (props: QuestionsGridProps) => {
    const { answers, correctId, correctChosen, options, onAnswer } = props

    const handleAnswerSelection = (e: React.MouseEvent<HTMLSpanElement, MouseEvent>) => {
        if (!correctChosen) {
            const choiceId = e.currentTarget.id
            onAnswer(choiceId)
        }
    }

    return (
        <div className="w-full max-w-sm grid grid-cols-2 auto-rows-fr">
            {options.map((option) => {
                const optionChosen = answers.includes(String(option.id));
                const className2 = cn(cellStyling,
                    optionChosen && (option.id === correctId ? correctCell : incorrectCell),
                    correctChosen && "hover:cursor-auto")
                return (<span key={option.id} id={`${option.id}`} onClick={handleAnswerSelection} className={className2}>{option.text}</span>)
            })}
        </div>
    )
}

interface RatingProps {
    correctChosen: boolean
    showCorrect: boolean
    handleUpdateProgress: (rating: number) => Promise<void>
}

const Rating = (props: RatingProps) => {
    const { correctChosen, showCorrect, handleUpdateProgress } = props
    const [showRatings, setShowRatings] = useState(false)
    const ratings = showCorrect ?
        [{ rating: 5, text: "Perfect recall" }, { rating: 4, text: "Correct with minor hesitation" }, { rating: 3, text: "Correct but required significant effort" }]
        : [{ rating: 2, text: "Wrong but easy to recall after seeing it" }, { rating: 1, text: "Wrong but the answer felt familiar" }, { rating: 0, text: "Complete blackout" }]

    const handleShowRatings = () => {
        if (correctChosen) setShowRatings(true)
    }

    const handleSubmitRating = async (rating: number) => {
        await handleUpdateProgress(rating)
        setShowRatings(false)
    }

    return (
        <div className=" w-full max-w-sm mt-8 grid grid-rows-3 auto-rows-fr">
            {showRatings ? ratings.map((rating) => {
                return <Button key={rating.rating} onClick={() => handleSubmitRating(rating.rating)}>{rating.text}</Button>
            }) : <Button className={`${correctChosen ? "bg-indigo-400" : "bg-gray-500 hover:cursor-default"}`} onClick={handleShowRatings}>Rate</Button>}
        </div>
    )
}

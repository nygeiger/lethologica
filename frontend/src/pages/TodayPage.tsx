import { Button } from "@/components/ui/button";
import { getNextWord, getRandomWords, updateUserWordProgress, type Word, type WordQueryResult } from "../api/client"
import { useEffect, useState } from "react";
import { ApiError } from "@/utils/ApiError.ts";
import { cn } from "@/lib/utils";
import { shuffleArray } from "../utils/utils.ts"
import WordCard from "@/components/WordCard.tsx";
import Menu from "@/components/Menu.tsx";
import { userStorage } from "@/utils/session.ts";
import { Skeleton } from "@/components/ui/skeleton";

const TodayPage = () => {
    const [currentWord, setCurrentWord] = useState<Word>()
    const [wordLoaded, setWordLoaded] = useState(false)
    const [incorrectChosen, setIncorrectChosen] = useState(false)
    const [correctChosen, setCorrectChosen] = useState(false)
    const [answers, setAnswers] = useState<string[]>(() => userStorage.loadAnswers())
    const [options, setOptions] = useState<{ text: string, id: number }[] | null>(() => userStorage.loadOptions())
    const currentIdString = String(currentWord?.id)

    const nextWord = async () => {
        try {
            setWordLoaded(false)
            const wordQueryResult = await getNextWord() satisfies WordQueryResult
            const word: Word = {
                id: Number(wordQueryResult.word_id ?? wordQueryResult.id), //? TODO: JSON map query result?
                word: wordQueryResult.word,
                def: wordQueryResult.def,
                example: wordQueryResult.example,
                pronunciation_url: wordQueryResult.pronunciation_url
            }
            setCurrentWord(word)
        } catch (err) {
            setCurrentWord(undefined)
        } finally {
            setWordLoaded(true)
        }
    }

    const clearAnswers = () => {
        userStorage.clearStoredAnswers()
        setAnswers([])
    }

    const clearOptions = () => {
        userStorage.clearStoredOptions()
        setOptions([])
    }

    useEffect(() => {
        nextWord()
    }, [])

    useEffect(() => {
        if (!currentWord) return

        const savedOptions = userStorage.loadOptions()
        if (savedOptions.length === 4 && savedOptions.some(option => String(option.id) === String(currentWord.id))) {
            setOptions(savedOptions)
            if (answers.includes(currentIdString)) setCorrectChosen(true)
            if (answers.length > 0 && !answers.every((val) => val === currentIdString)) setIncorrectChosen(true)
            return
        }

        getRandomWords(currentWord.id, 3)
            .then(wrongWords => {
                const shuffled = shuffleArray([
                    { text: currentWord.def, id: currentWord.id },
                    ...wrongWords.map(w => ({ text: w.def, id: w.id }))
                ])
                setOptions(shuffled)
                userStorage.saveOptions(shuffled)
                clearAnswers()
            })
            .catch(() => {
                // empty options triggers error state
                setOptions(null)
                clearAnswers()
                clearOptions()
            })
    }, [currentWord])

    const handleAnswer = (choiceId: string) => {
        const isCorrect = choiceId === currentIdString
        const next = [...answers, choiceId]
        setAnswers(next)
        userStorage.saveAnswers(next)

        if (isCorrect) setCorrectChosen(true)
        else setIncorrectChosen(true)
    }

    const handleUpdateProgress = async (rating: number) => {
        try {
            await updateUserWordProgress(currentWord!.id, rating)

            clearAnswers()
            clearOptions()

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
            <div className="absolute top-0 right-0"><Menu /></div>
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-2xl pt-20 mb-25">Lethologica</h1>
                {wordLoaded ?
                    currentWord ?
                        <div>
                            <WordCard word={currentWord} displayDef={false} displayAddToList={correctChosen} />
                            {options ? options.length === 0
                                ? <div className="grid w-full max-w-sm grid-cols-2 gap-2">
                                    <Skeleton className="h-20 w-full rounded-md" />
                                    <Skeleton className="h-20 w-full rounded-md" />
                                    <Skeleton className="h-20 w-full rounded-md" />
                                    <Skeleton className="h-20 w-full rounded-md" />
                                </div>
                                : <OptionsGrid
                                    correctId={currentWord.id}
                                    correctChosen={correctChosen}
                                    options={options}
                                    answers={answers}
                                    onAnswer={handleAnswer}
                                />
                                : <div className="text-red-500 text-sm">Failed to load answer choices. Try refreshing.</div>
                            }
                            <Rating correctChosen={correctChosen} showCorrect={!incorrectChosen} handleUpdateProgress={handleUpdateProgress} />
                        </div>
                        : <div className="text-red-500 text-sm">Failed to load your next word. Try refreshing.</div>
                    : <div className="w-full max-w-sm"><Skeleton className="h-40 w-full rounded-xl" /></div>
                }
            </div>
        </>
    )
}
export default TodayPage;

interface QuestionsGridProps {
    answers: string[]
    correctId: number
    correctChosen: boolean
    options: { text: string, id: number }[]
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
        [{ rating: 5, text: "Perfect recall" }, { rating: 4, text: "Correct with minor hesitation" }, { rating: 3, text: "Correct but required significant effort or guessed" }]
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

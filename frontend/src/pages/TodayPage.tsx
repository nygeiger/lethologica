import { Button } from "@/components/ui/button";
import { getNextWord, getRandomWords, getWordById, updateUserWordProgress, type Word, type WordQueryResult } from "../api/client"
import { useEffect, useState } from "react";
import { ApiError } from "@/utils/ApiError.ts";
import { cn } from "@/lib/utils";
import { shuffleArray } from "../utils/utils.ts"
import WordCard from "@/components/WordCard.tsx";
import Menu from "@/components/Menu.tsx";
import { userStorage, type HistoryEntry } from "@/utils/session.ts";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronUp, ChevronDown } from "lucide-react";

const TodayPage = () => {
    const [currentWord, setCurrentWord] = useState<Word>()
    const [wordLoaded, setWordLoaded] = useState(false)
    const [incorrectChosen, setIncorrectChosen] = useState(false)
    const [correctChosen, setCorrectChosen] = useState(false)
    const [answers, setAnswers] = useState<string[]>(() => userStorage.loadAnswers())
    const [options, setOptions] = useState<{ text: string, id: number }[] | null>(() => userStorage.loadOptions())

    // History navigation state
    const [history, setHistory] = useState<HistoryEntry[]>(() => userStorage.loadHistory())
    const [viewIndex, setViewIndex] = useState<number | null>(null) // null = on current word
    const [historyWord, setHistoryWord] = useState<Word | null>(null)

    const currentIdString = String(currentWord?.id)

    // Derived display state — show history word when navigating back, current word otherwise
    const displayWord = viewIndex !== null ? historyWord : currentWord
    const isViewingHistory = viewIndex !== null
    const historyEntry = viewIndex !== null ? history[viewIndex] : undefined

    const nextWord = async () => {
        try {
            setWordLoaded(false)
            const wordQueryResult = await getNextWord() satisfies WordQueryResult
            const word: Word = {
                id: Number(wordQueryResult.word_id ?? wordQueryResult.id),
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

    const loadHistoryWord = async (wordId: number) => {
        try {
            setWordLoaded(false)
            const word = await getWordById(wordId)
            setHistoryWord(word)
        } catch (err) {
            setHistoryWord(null)
        } finally {
            setWordLoaded(true)
        }
    }

    const handleBack = () => {
        if (history.length === 0) return
        const newIndex = viewIndex === null
            ? history.length - 1  // go to most recent viewed word
            : viewIndex - 1       // go further back
        if (newIndex < 0) return
        setViewIndex(newIndex)
        loadHistoryWord(history[newIndex]!.wordId)
    }

    const handleForward = () => {
        if (viewIndex === null) return
        const newIndex = viewIndex + 1
        if (newIndex >= history.length) {
            // back to current word
            setViewIndex(null)
            setHistoryWord(null)
            setWordLoaded(true)
        } else {
            setViewIndex(newIndex)
            loadHistoryWord(history[newIndex]!.wordId)
        }
    }

    // Button visibility rules
    const showUpButton = history.length > 0 && (viewIndex === null || viewIndex > 0)
    const showDownButton = viewIndex !== null

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
        if (!currentWord || isViewingHistory) return

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

            // record this word, its options and the user's choices in viewed history
            const newHistory = [...history, { wordId: currentWord!.id, options: options ?? [], answers }]
            setHistory(newHistory)
            userStorage.saveHistory(newHistory)

            clearAnswers()
            clearOptions()
            setIncorrectChosen(false)
            setCorrectChosen(false)

            await nextWord()
        } catch (err) {
            if (err instanceof ApiError) {
                const { stack, ...error } = err
                console.error("Error when updating word progress", error)
            }
        }
    }

    return (
        <>
            <div className="absolute top-0 right-0"><Menu /></div>
            <div className="flex flex-col items-center justify-center">
                <h1 className="text-2xl pt-20 mb-25">Lethologica</h1>
                {wordLoaded ?
                    displayWord ?
                        <div className="flex flex-row gap-6 items-start">
                            {/* Nav buttons — left side */}
                            <div className="flex flex-col gap-4 pt-4">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleBack}
                                    disabled={!showUpButton}
                                    className={cn(!showUpButton && "opacity-0 pointer-events-none")}
                                >
                                    <ChevronUp />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleForward}
                                    disabled={!showDownButton}
                                    className={cn(!showDownButton && "opacity-0 pointer-events-none")}
                                >
                                    <ChevronDown />
                                </Button>
                            </div>

                            {/* Word content */}
                            <div>
                                <WordCard
                                    word={displayWord}
                                    displayDef={false}
                                    displayAddToList={!isViewingHistory && correctChosen}
                                />
                                {isViewingHistory && historyEntry && historyEntry.options.length > 0 && (
                                    <OptionsGrid
                                        correctId={displayWord.id}
                                        correctChosen={true}
                                        options={historyEntry.options}
                                        answers={historyEntry.answers}
                                        onAnswer={() => { }}
                                    />
                                )}
                                {!isViewingHistory && (
                                    <>
                                        {options ? options.length === 0
                                            ? <div className="grid w-full max-w-sm grid-cols-2 gap-2">
                                                <Skeleton className="h-20 w-full rounded-md" />
                                                <Skeleton className="h-20 w-full rounded-md" />
                                                <Skeleton className="h-20 w-full rounded-md" />
                                                <Skeleton className="h-20 w-full rounded-md" />
                                            </div>
                                            : <OptionsGrid
                                                correctId={currentWord!.id}
                                                correctChosen={correctChosen}
                                                options={options}
                                                answers={answers}
                                                onAnswer={handleAnswer}
                                            />
                                            : <div className="text-red-500 text-sm">Failed to load answer choices. Try refreshing.</div>
                                        }
                                        <Rating
                                            correctChosen={correctChosen}
                                            showCorrect={!incorrectChosen}
                                            handleUpdateProgress={handleUpdateProgress}
                                        />
                                    </>
                                )}
                            </div>
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
        <div className="w-full max-w-sm mt-8 grid grid-rows-3 auto-rows-fr">
            {showRatings ? ratings.map((rating) => {
                return <Button key={rating.rating} onClick={() => handleSubmitRating(rating.rating)}>{rating.text}</Button>
            }) : <Button className={`${correctChosen ? "bg-indigo-400" : "bg-gray-500 hover:cursor-default"}`} onClick={handleShowRatings}>Rate</Button>}
        </div>
    )
}

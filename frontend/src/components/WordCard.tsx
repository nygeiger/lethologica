import type { Word } from "@/api/client"
import { useState, useRef, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"

interface WordCardProps {
    word: Word
    displayDef: boolean
    getPreviousWord?: () => void
}

const WordCard = (props: WordCardProps) => {

    const { word, displayDef } = props
    const [validAudio, setValidAudio] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        setValidAudio(false) // to clearing audio icon on TodayPage
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
export default WordCard;
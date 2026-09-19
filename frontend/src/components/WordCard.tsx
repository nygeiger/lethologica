import type { List, Word } from "@/api/client"
import { useState, useRef, useEffect } from "react"
import { PlusIcon } from "lucide-react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card"
import { Button } from "./ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog"
import { addWordToList, getUsersLists } from "@/api/client"
import { toast } from "@/components/ui/toast"
import { Skeleton } from "@/components/ui/skeleton"

interface WordCardProps {
    word: Word
    displayDef: boolean
    displayAddToList?: boolean
    getPreviousWord?: () => void
}

const WordCard = (props: WordCardProps) => {

    const { word, displayDef, displayAddToList = false } = props
    const [validAudio, setValidAudio] = useState(false)
    const [editableLists, setEditableLists] = useState<List[]>([])
    const [dialogOpen, setDialogOpen] = useState(false)
    const [listsLoading, setListsLoading] = useState(false)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    useEffect(() => {
        setValidAudio(false) // to clear audio icon on TodayPage
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

    const loadEditableLists = async () => {
        try {
            setListsLoading(true)
            const lists = await getUsersLists()
            setEditableLists(lists.filter((list) => list.can_edit))
        } catch (error) {
            console.error("Failed to load lists for word card add dialog", error)
            setEditableLists([])
        } finally {
            setListsLoading(false)
        }
    }

    const handleAddWordToList = async (listId: string) => {
        const listName = editableLists.find((list) => list.id === listId)?.list_name ?? "this list"

        toast.promise(
            new Promise(async (resolve, reject) => {
                try {
                    setDialogOpen(false)
                    await addWordToList(listId, String(word.id))
                    resolve(null)
                } catch (error) {
                    reject(error instanceof Error ? error : new Error("Failed to add word to list"))
                }
            }),
            {
                loading: `Adding "${word.word}" to ${listName}...`,
                success: `Added "${word.word}" to "${listName}"`,
                error: (err: Error) => `Error: ${err.message}`
            }
        )
    }

    return (
        <div className="relative w-full max-w-sm mb-10">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle>
                        <span className="mr-2">{word.word}</span>
                        {validAudio && <button onClick={handleAudio}>
                            <img src="/icons/audio-speaker.svg" width={20} height={20} />
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

            {displayAddToList && (
                <Dialog open={dialogOpen} onOpenChange={(nextOpen) => {
                    setDialogOpen(nextOpen)
                    if (nextOpen) {
                        void loadEditableLists()
                    }
                }}>
                    <DialogTrigger render={
                        <Button type="button" variant="outline" size="icon-xs" className="absolute top-2 right-2 z-10 bg-background/90 shadow-sm">
                            <PlusIcon className="size-3.5" />
                        </Button>
                    } />
                    <DialogContent className="sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle>Add word to list</DialogTitle>
                            <DialogDescription>
                                Pick a list to save "{word.word}".
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-2 pt-2">
                            {listsLoading ? (
                                <div className="space-y-2">
                                    <Skeleton className="h-10 w-full rounded-md" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                    <Skeleton className="h-10 w-full rounded-md" />
                                </div>
                            ) : editableLists.length === 0 ? (
                                <p className="text-sm text-muted-foreground">You do not have any editable lists yet.</p>
                            ) : (
                                editableLists.map((list) => (
                                    <Button
                                        key={list.id}
                                        type="button"
                                        variant="outline"
                                        className="justify-start"
                                        onClick={() => void handleAddWordToList(list.id)}
                                    >
                                        {list.list_name}
                                    </Button>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    )
}
export default WordCard;
import { useEffect, useMemo, useState } from "react"
import { getUserHistory, type JoinedWordAndUWPResult } from "@/api/client"
import Menu from "@/components/Menu"
import WordCard from "@/components/WordCard"
import { Skeleton } from "@/components/ui/skeleton"

const HistoryPage = () => {
    const [history, setHistory] = useState<JoinedWordAndUWPResult>()
    const sortedHistory = useMemo(() => {
        // Spread array [...events] to avoid mutating the original prop
        if (history) return [...history].sort((a, b) => b.uwp.last_reviewed_at.localeCompare(a.uwp.last_reviewed_at)); // Descending
        else return []
    }, [history]);

    const loadHistory = async () => {
        try {
            setHistory(await getUserHistory())
        } catch (err) {
            console.log(err)
        }
    }

    useEffect(() => {
        loadHistory()
    }, [])

    return (<>
        <div className="absolute top-0 right-0"><Menu /></div>
        <div className="flex flex-col items-center justify-center">
            <h1 className="text-2xl pt-20 mb-25">History</h1>
            {history ?
                sortedHistory.length === 0 ? <div>No words reviewed yet. Head back to today's word to get started.</div> :
                    <div className="flex flex-col">
                        {sortedHistory.map((val) => { return <WordCard key={val.word.id} word={val.word} displayDef={true} displayAddToList={true} /> })}
                    </div>
                : <div className="w-full max-w-sm"><Skeleton className="h-40 w-full rounded-xl" /></div>}
        </div>
    </>)
}
export default HistoryPage
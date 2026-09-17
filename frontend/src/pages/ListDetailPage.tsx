import { useParams } from 'react-router-dom';
import { getList, getListWords, type List, type Word } from "@/api/client";
import { useEffect, useState } from 'react';
import { PencilLine, Settings, Trash2, Users } from 'lucide-react';
import Menu from '@/components/Menu';
import { ApiError } from '@/utils/ApiError';
import WordCard from '@/components/WordCard';
import { Button } from '@/components/ui/button';

const ListDetailPage = () => {
    const { listId } = useParams()
    const [list, setList] = useState<List>()
    const [listWords, setListWords] = useState<Word[]>([])
    const [listLoaded, setListLoaded] = useState(false)
    const [showListActions, setShowListActions] = useState(false)

    const loadListWords = async () => {
        try {
            setListWords(await getListWords(listId!))
        } catch (err) {
            if (err instanceof ApiError) {
                if (err.status === 404) {
                    setListWords([])
                }
            }
        } finally {
            setListLoaded(true)
        }
    }

    const loadList = async () => {
        try {
            setList(await getList(listId!))
        } catch (err) {
            if (err instanceof ApiError) {
                console.error(err)
            } else {
                console.error("Error loading list words")
            }
        }
    }

    useEffect(() => {
        loadList()
        loadListWords()
    }, [])

    const listActions = [
        { label: 'Rename list', icon: <PencilLine className="size-4" />, onClick: () => console.info('Rename list is not implemented yet.') },
        { label: 'Manage shares', icon: <Users className="size-4" />, onClick: () => console.info('Manage shares is not implemented yet.') },
        { label: 'Delete list', icon: <Trash2 className="size-4" />, onClick: () => console.info('Delete list is not implemented yet.') },
    ]

    return (
        <>
            <div className="absolute top-0 right-0"><Menu /></div>
            <div className="flex flex-col items-center justify-center">
                <div className="pt-20 mb-25 flex items-center gap-2">
                    <h1 className="text-2xl">{list === undefined ? "List" : list.list_name}</h1>
                    {list?.can_edit && (
                        <div className="relative">
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                aria-label="List actions"
                                // className={}
                                onClick={() => setShowListActions((previous) => !previous)}
                                // onBlur={() => setShowListActions(false)}
                            >
                                {/* <MoreHorizontal className="size-4" /> */}
                                <Settings className="size-4" />
                            </Button>
                            {showListActions && (
                                <div className="absolute right-0 top-full mt-2 z-10 min-w-44 rounded-md border bg-popover p-1 shadow-lg">
                                    {listActions.map((action) => (
                                        <Button
                                            key={action.label}
                                            type="button"
                                            variant="ghost"
                                            className="w-full justify-start gap-2 px-2 py-1.5"
                                            onClick={() => {
                                                action.onClick()
                                                setShowListActions(false)
                                            }}
                                        >
                                            {action.icon}
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {listLoaded ?
                    listWords.length === 0 ? <div>This list doesn't have any words yet. Head to your history and add one!</div> :
                        <div className="flex flex-col">
                            {listWords.map((val) => { return <WordCard key={val.id} word={val} displayDef={true} displayAddToList={true} /> })}
                        </div>
                    : <div>Loading...</div>}
            </div>
        </>
    )
}
export default ListDetailPage;
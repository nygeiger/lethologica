import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { PencilLine, Settings, Trash2, Users } from 'lucide-react';
import { getList, getListWords, type List, type Word } from "@/api/client";
import Menu from '@/components/Menu';
import { ApiError } from '@/utils/ApiError';
import WordCard from '@/components/WordCard';
import { Button } from '@/components/ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup } from '@/components/ui/field'
import { toast } from '@/components/ui/toast'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuthContext } from '@/context/AuthContext';
import { renameList, deleteList } from '@/api/client'

const ListDetailPage = () => {
    const { listId } = useParams()
    const [list, setList] = useState<List>()
    const [listWords, setListWords] = useState<Word[]>([])
    const [listLoaded, setListLoaded] = useState(false)
    const authContext = useAuthContext()

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

    return (
        <>
            <div className="absolute top-0 right-0"><Menu /></div>
            <div className="flex flex-col items-center justify-center">
                <div className="pt-20 mb-25 flex items-center gap-2">
                    <h1 className="text-2xl">{list === undefined ? "List" : list.list_name}</h1>
                    {/* {list?.can_edit && <ListActionsMenu />} */}
                    {list?.owner_id === authContext.userId && <ListActionsMenu listId={listId} list={list} reloadList={loadList} />}
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

function ListActionsMenu(props: { listId?: string, list?: List, reloadList?: () => void }) {
    const navigate = useNavigate()
    const { listId, list, reloadList } = props
    const [renameOpen, setRenameOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const renameRef = useRef<HTMLInputElement>(null)

    const listActions = [
        { label: 'Rename list', icon: <PencilLine className="size-4" />, onClick: () => setRenameOpen(true) },
        { label: 'Manage shares', icon: <Users className="size-4" />, onClick: () => console.info('Manage shares is not implemented yet.') },
        { label: 'Delete list', icon: <Trash2 className="size-4" />, onClick: () => setDeleteOpen(true) },
    ]

    const handleRenameList = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault()
        const newName = renameRef.current?.value
        if (!newName || !listId) return
        // const p = renameList(listId, newName)
        toast.promise(new Promise(async (resolve, reject) => {
            try {
                setRenameOpen(false)
                await renameList(listId, newName)
                resolve(null)
            } catch (err) {
                console.error(err)
                reject(err)
            } finally {
                reloadList?.()
            }
        }), {
            loading: `Renaming list...`,
            success: `Renamed to "${newName}"`,
            error: (err: Error) => `Error: ${err.message}`
        })
    }

    const handleDeleteList = async () => {
        if (!listId) return
        toast.promise(new Promise(async (resolve, reject) => {
            try {
                setDeleteOpen(false)
                await deleteList(listId)
                navigate('/lists')
                resolve(null)
            } catch (err) {
                reject(err)
            }
        }), {
            loading: `Deleting "${list?.list_name ?? 'list'}"...`,
            success: `Deleted "${list?.list_name ?? 'list'}"`,
            error: (err: Error) => `Error: ${err.message}`
        })
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger render={<Button type="button" variant="ghost" size="icon-sm" aria-label="List actions"> <Settings className="size-4" /></Button>} />
            <DropdownMenuContent>
                {listActions.map((action) => {
                    return (
                        <DropdownMenuItem key={action.label} onClick={action.onClick}>{action.icon}{action.label}</DropdownMenuItem>
                    )
                })}
            </DropdownMenuContent>

            {/* Rename dialog */}
            <Dialog open={renameOpen} onOpenChange={setRenameOpen}>
                <DialogTrigger render={<div />} />
                <DialogContent className="sm:max-w-sm">
                    <form id="rename-list" onSubmit={handleRenameList}>
                        <DialogHeader>
                            <DialogTitle>Rename list</DialogTitle>
                            <DialogDescription>Give your list a new name.</DialogDescription>
                        </DialogHeader>
                        <FieldGroup className="py-2">
                            <Field>
                                <Input id="renameList" name="renameList" defaultValue={list?.list_name ?? ''} ref={renameRef} required={true} />
                            </Field>
                        </FieldGroup>
                        <DialogFooter>
                            <DialogClose render={<Button variant="outline">Cancel</Button>} />
                            <Button type="submit" form="rename-list">Rename</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete dialog */}
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <DialogTrigger render={<div />} />
                <DialogContent className="sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Delete list</DialogTitle>
                        <DialogDescription>This action cannot be undone. Deleting this list will remove it and its membership permanently.</DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DialogClose render={<Button variant="outline">Cancel</Button>} />
                        <Button variant="destructive" onClick={handleDeleteList}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DropdownMenu>
    )
}
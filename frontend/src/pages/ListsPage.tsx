import { useEffect, useRef, useState } from "react"
import { PlusIcon } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { createList, getUsersLists, type List } from "@/api/client"
import Menu from "@/components/Menu"
import { ApiError } from "@/utils/ApiError"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { Input } from "@/components/ui/input"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Field, FieldGroup } from "@/components/ui/field"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuthContext } from "@/context/AuthContext"

const ListsPage = () => {
  const [lists, setLists] = useState<List[]>([])
  const [listsLoaded, setListsLoaded] = useState(false)

  const getLists = async () => {
    try {
      setListsLoaded(false)
      const result = await getUsersLists()
      setLists(result)
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 404) {
          setLists([])
        }
      } else {
        // console.error(err)
      }
    } finally {
      setListsLoaded(true)
    }
  }

  useEffect(() => {
    getLists();
  }, [])

  return (<>
    <div className="flex flex-col justify-items-end absolute top-0 right-0"><Menu />{listsLoaded && lists.length > 0 && <div className="mx-auto"><CreateListDialog refreshLists={getLists} /></div>}</div>
    <div className="flex flex-col items-center justify-center">
      <h1 className="text-2xl pt-20 mb-10">Lists</h1>
      {listsLoaded ?
        lists.length === 0 ? <div className="flex flex-row gap-2">You don' have any Lists yet. Try Creating one! <CreateListDialog refreshLists={getLists} /></div> :
          <div className="flex flex-col">
            {lists.map((val) => { return <ListCard key={val.id} list={val} /> })}
          </div>
        : <div>Loading...</div>}
    </div>
  </>)
}

interface ListCardProps {
  list: List
}

const ListCard = (props: ListCardProps) => {
  const { list } = props
  const authContext = useAuthContext()
  const navigate = useNavigate()
  const isOwner = authContext.userId === list.owner_id
  return (
    <Card className="w-2xl justify-items-center max-w-sm mb-10 hover:outline-2 hover:outline-violet-400 hover:cursor-pointer" onClick={() => navigate(`/lists/${list.id}`)}>
      <CardHeader>
        <CardTitle>
          <span className={"font-heading text-base leading-normal font-medium group-data-[size=sm]/card:text-sm"}>{list.list_name}</span>
        </CardTitle>
        <CardDescription className="flex flex-col gap-3">
          {isOwner ? "Owned by you" : "Shared with you"}
        </CardDescription>
      </CardHeader>
      <CardContent className="text-gray-400">
        {`Created at ${(new Date(list.created_at)).toLocaleDateString()}`}
      </CardContent>
    </Card>
  )

}
export default ListsPage

interface CreateListDialogProps {
  refreshLists: () => void
}
function CreateListDialog(props: CreateListDialogProps) {
  const { refreshLists } = props
  const [open, setOpen] = useState(false)
  const listNameRef = useRef<HTMLInputElement>(null);

  const createList2 = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault()
    const listName = listNameRef.current?.value
    if (listName) {
      toast.promise(
        new Promise(async (resolve, reject) => {
          try {
            await createList(listName)
            resolve(null)
            refreshLists()
          } catch (err) {
            if (err instanceof ApiError) {
              reject(err)
            } else {
              reject(new Error("Failed to create list"))
            }
          }
        })
        ,
        {
          loading: "Creating list...",
          success: `Successfully created \"${listName}\"`,
          error: (err: ApiError | Error) => `Error: ${err.message}`
        }
      )
      setOpen(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size={"icon-xs"} variant={"outline"} className={"bg-blue-600 text-white"}><PlusIcon /></Button>} />
      <DialogContent className="sm:max-w-sm">
        <form id="create-list" onSubmit={createList2}>
          <DialogHeader>
            <DialogTitle>Create List</DialogTitle>
            <DialogDescription>
              Create a new list. You can save your favorite words and even share them with your friends
            </DialogDescription>
          </DialogHeader>
          <FieldGroup className="py-2">
            <Field>
              <Input id="listName" name="listName" defaultValue="New List" ref={listNameRef} />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" form="create-list">Create List</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

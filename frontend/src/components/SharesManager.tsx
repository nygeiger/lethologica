import { useEffect, useRef, useState } from "react"
import { CircleMinusIcon } from "lucide-react"
import type { Share } from "@/api/client"
import { getListShares, searchUsers, addShare, updateShare, deleteShare } from "@/api/client"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { toast } from "@/components/ui/toast"
import { ApiError } from "@/utils/ApiError"

interface SharesManagerProps {
  listId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function SharesManager(props: SharesManagerProps) {
  const { listId, open, onOpenChange } = props

  const [shares, setShares] = useState<Share[]>([])

  // search state
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<{ id: string; email: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<{ id: string; email: string } | null>(null)
  const [roleToAdd, setRoleToAdd] = useState<string>("viewer")
  const debounceRef = useRef<number | null>(null)

  // delete confirmation
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false)
  const [toDeleteShare, setToDeleteShare] = useState<Share | null>(null)

  const loadShares = async () => {
    try {
      const s = await getListShares(listId)
      setShares(Array.isArray(s) ? s : [])
    } catch (err) {
      console.error(err)
      setShares([])
    }
  }

  // fetch shares when dialog opens
  useEffect(() => {
    if (open) {
      void loadShares()
    }
  }, [open, listId])

  // debounce search
  useEffect(() => {
    if (!query) {
      setResults([])
      return
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current)
    // @ts-ignore window.setTimeout typing
    debounceRef.current = window.setTimeout(async () => {
      try {
        const res = await searchUsers(query, listId)
        setResults(res)
      } catch (err) {
        console.error(err)
        setResults([])
      }
    }, 300)

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current)
    }
  }, [query, listId])

  const handleSelectResult = (r: { id: string; email: string }) => {
    setSelectedUser(r)
    setQuery(r.email)
    setResults([])
  }

  const handleAdd = async () => {
    if (!selectedUser) return
    try {
      const p = new Promise(async (resolve, reject) => {
        try {
          await addShare(listId, selectedUser.email, roleToAdd as any)
          resolve(null)
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to add share'))
        }
      })
      toast.promise(p, {
        loading: `Adding ${selectedUser.email}...`,
        success: `Added ${selectedUser.email}`,
        error: (err: Error) => `Error: ${err.message}`,
      })
      await p
      setSelectedUser(null)
      setQuery("")
      setResults([])
      await loadShares()
    } catch (err) {
      if (err instanceof ApiError) {
        console.error(err)
      }
    }
  }

  const handleUpdateRole = async (shareId: string, newRole: string) => {
    try {
      const p = new Promise(async (resolve, reject) => {
        try {
          await updateShare(listId, shareId, newRole as any)
          resolve(null)
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to update share role'))
        }
      })
      toast.promise(p, {
        loading: `Updating role...`,
        success: `Updated role`,
        error: (err: Error) => `Error: ${err.message}`,
      })
      await p
      await loadShares()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (share: Share) => {
    setToDeleteShare(share)
    setConfirmDeleteOpen(true)
  }

  const handleConfirmDelete = async () => {
    if (!toDeleteShare) return
    try {
      const p = new Promise(async (resolve, reject) => {
        try {
          await deleteShare(listId, toDeleteShare.id)
          resolve(null)
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Failed to delete share'))
        }
      })
      toast.promise(p, {
        loading: `Removing ${toDeleteShare.shared_with_email ?? toDeleteShare.shared_with_user_id}...`,
        success: `Removed user from list`,
        error: (err: Error) => `Error: ${err.message}`,
      })
      await p
      setConfirmDeleteOpen(false)
      setToDeleteShare(null)
      await loadShares()
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Manage shares</DialogTitle>
          <DialogDescription>View and update who has access to this list.</DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          <div className="grid grid-cols-3 gap-4 font-medium pb-2 border-b">
            <div>Email</div>
            <div>Role</div>
            <div></div>
          </div>

          <div className="flex flex-col gap-2 mt-2 max-h-72 overflow-auto">
            {shares.map((s) => (
              <div key={s.id} className="grid grid-cols-3 items-center gap-4">
                <div className="min-w-0">
                  <div className="truncate" title={s.shared_with_email ?? s.shared_with_user_id}>
                    {s.shared_with_email ?? s.shared_with_user_id}
                  </div>
                </div>
                <div>
                  <Select onValueChange={(v: unknown) => void handleUpdateRole(s.id, String(v))}>
                    <SelectTrigger className="w-36"><SelectValue>{s.role}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="viewer">viewer</SelectItem>
                      <SelectItem value="editor">editor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Button variant="ghost" size="icon-sm" onClick={() => void handleDelete(s)}>
                    <CircleMinusIcon />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t pt-4">
          <h3 className="font-medium mb-2">Add share</h3>
          <div className="flex gap-2 items-start">
            <div className="flex-1">
              <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users by email" />
              {results.length > 0 && (
                <div className="border rounded bg-popover mt-1 max-h-48 overflow-auto">
                  {results.map((r) => (
                    <div key={r.id} className="p-2 hover:bg-muted cursor-pointer" onClick={() => handleSelectResult(r)}>{r.email}</div>
                  ))}
                </div>
              )}
            </div>

            <div className="w-36">
              <Select onValueChange={(v: unknown) => setRoleToAdd(String(v))}>
                <SelectTrigger className="w-full"><SelectValue>{roleToAdd}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">viewer</SelectItem>
                  <SelectItem value="editor">editor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Button onClick={() => void handleAdd()} disabled={!selectedUser}>Add</Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline">Close</Button>} />
        </DialogFooter>

        {/* nested delete confirmation dialog */}
        <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Remove access</DialogTitle>
              <DialogDescription>Are you sure you want to remove this user's access? This cannot be undone.</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose render={<Button variant="outline">Cancel</Button>} />
              <Button variant="destructive" onClick={() => void handleConfirmDelete()}>Remove</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  )
}

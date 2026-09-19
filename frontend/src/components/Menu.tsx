import { getUser } from "@/api/client"
import { MenuIcon } from "lucide-react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerFooter,
    DrawerHeader,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Button } from "@/components/ui/button"
import { useAuthContext } from "@/context/AuthContext"
import { userStorage } from "@/utils/session"

const Menu = () => {
    const authContext = useAuthContext();
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

    const logout = () => {
        sessionStorage
        authContext.logout()
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
                <div className="flex flex-col scroll-fade overflow-y-auto">
                    <Button variant={"link"} onClick={() => navigate("/today")}>Home</Button>
                    <Button variant={"link"} onClick={() => navigate("/history")}>View History</Button>
                    <Button variant={"link"} onClick={() => navigate("/lists")}>View Lists</Button>
                </div>
                <DrawerFooter>
                    <span className="text-gray-400">{userEmail}</span>
                    <Button variant={"destructive"} onClick={logout}>Logout</Button>
                    <DrawerClose render={<Button variant="outline">Close</Button>} />
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    )
}
export default Menu;
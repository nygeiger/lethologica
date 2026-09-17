export const roles = ["editor", "owner", "viewer"] as const
export type Role = typeof roles[number]
export type Permission = "canShare" | "canEdit" | "canView" | "isOwner"
export const rolePermissions = new Map<Role, Permission[]>(
    [
        ["owner", ["canShare", "canEdit", "canView", "isOwner"]],
        ["editor", ["canEdit", "canView"]],
        ["viewer", ["canView"]]
    ]
)

export type List = {
    id: string
    list_name: string
    owner_id: string
    created_at: string
    can_edit: boolean
}